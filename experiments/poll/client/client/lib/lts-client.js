const st = require("stream");
const { URL } = require('url');
const ldfetch = require('ldfetch');
const WebSocketStream = require('websocket-stream');
const http = require('http');
const n3 = require('n3');
const ds = require('./dataset.js');

module.exports = class {

  constructor(config) {
    //TODO: configuration reading
    this._http = new ldfetch();
    this._n3Parser = n3.Parser();
    this._catalogUrl = config.catalogUrl;
    this._preferredProtocol = config.preferredProtocol;
    this._lastGeneratedAtTime = null;
    this._clockDifference = 0;
    this._medianLatency = 0;
  }

  //Get the information of all datasets
  getCatalog() {
    return new Promise(async (resolve, reject) => {
      try {
        let response = await this._http.get(this._catalogUrl);
        let triples = response.triples;
        let datasets = [];
        let streams = [];

        for (var i in triples) {
          if (triples[i].object === 'http://www.w3.org/ns/dcat#Distribution') {
            streams.push(new ds.Stream(triples[i].subject, triples));
          }
          if (triples[i].object === 'http://www.w3.org/ns/dcat#Dataset') {
            datasets.push(new ds.Dataset(triples[i].subject, triples));
          }
        }

        for (let j in datasets) {
          for (let k in datasets[j].distributions) {
            let stream = this.findStreamById(datasets[j].distributions[k], streams);
            datasets[j].streams.push(stream);
          }
        }

        resolve(datasets);
      } catch (err) {
        reject(err);
      }
    });
  }

  // TODO: Array of promises for handling async http requests
  syncWithServer(stream) {
    return new Promise((resolve, reject) => {
      let timesync = stream.timesync;
      let latencies = [];
      let clock_diffs = [];
      let counter = 0;

      let sync = setInterval(() => {
        let req_time = new Date();
        http.get(timesync, res => {
          let body = '';

          res.on('data', chunk => {
            body += chunk;
          });

          res.on('end', () => {
            let res_time = new Date();
            let latency = (res_time - req_time) / 2;
            let server_time = new Date(body);
            let clock_diff = res_time.getTime() - (server_time.getTime() + latency);
            latencies.push(latency);
            clock_diffs.push(clock_diff);
            counter++;

            if (counter > 9) {
              clearInterval(sync);
              clock_diffs.sort((a, b) => {
                return b - a;
              });
              this._clockDifference = clock_diffs[0];
              this._medianLatency = this.median(latencies);
              resolve();
            }
          });
        });
      }, 500);
    });
  }

  /**
   * Function that subscribes to a stream, and subscribes to the stream based on its description found on the entry page
   */
  subscribe(dataset) {
    return new Promise(async (resolve, reject) => {
      // Find and subscribe to WebSocket stream
      if (this._preferredProtocol === 'ws') {
        let wsStream = this.findStreamByProtocol('ws', dataset.streams);
        if (wsStream !== null) {
          await this.syncWithServer(wsStream);
          resolve(this.openWebsocket(wsStream));
        } else {
          reject(new Error('There is no WebSocket stream available'));
        }
      } else { // Find and use HTTP polling on stream endpoint  
        let httpStream = this.findStreamByProtocol('http', dataset.streams);
        if (httpStream !== null) {
          await this.syncWithServer(httpStream);
          resolve(this.startPolling(httpStream));
        } else {
          reject(new Error('There is no stream HTTP endpoint available'));
        }
      }
    });
  }

  startPolling(stream) {
    //Create stream
    let data_stream = new st.PassThrough();
    data_stream.streamId = stream.id;
    let url = new URL(stream.accessUrl[0]);
    //let url = new URL('http://localhost:3000/data');
    //Start polling
    this.schedulePollRequest(url, {}, 0, data_stream);
    this.streamProtocolInUse = "http";
    return data_stream;
  }

  schedulePollRequest(url, headers, time, data_stream) {
    setTimeout(() => {
      let req_options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        headers: headers
      };

      http.get(req_options, response => {
        let headers = response.headers;
        let etag = headers.etag;
        let max_age = this.getValueFromHeader('max-age', headers['cache-control'].split(',')) * 1000;
        //let expires = new Date(headers['expires']);
        let x_proxy_cache = headers['x-proxy-cache'];
        let new_headers = {};
        let body = '';

        // Assemble stream data
        response.on('data', chunk => {
          body += chunk;
        });

        // Stream the complete body at once
        response.on('end', async () => {
          // Get last prov:generatedAtTime
          let current_data = await this.getGeneratedAtTime(body);
          // Schedule next request based on Cache-Control and Etag (if available) headers
          if (etag) {
            new_headers = { 'If-None-Match': etag };
          }

          // Adjust the obtained generatedAtTime with clock difference between client and server
          let last_modified = new Date(current_data.getTime() + this._clockDifference);
          let response_time = new Date();
          // Age of the data according to client clock
          let age = response_time - last_modified;
          // Subsecond component of the data age 
          let offset = age % 1000;

          // Next request defined as the difference of obtained Max-Age header and the subsecond component of the data age. 
          // Also substract the median latency for better accuracy (use absolute value to deal with big latencies)
          let next_request = Math.abs(max_age - offset - this._medianLatency);

          if (x_proxy_cache === 'HIT') {
            if(age > max_age) {
              // For some reason nginx has not updated the cache yet
              next_request = offset;
            } else {
              // Cache HIT so max_age is not the real remaining time, use age to determine when to poll next
              next_request = max_age - age;
            }
          } else {
            if(age > max_age && (age - max_age) > 1000) {
              // For some reason Nginx is reporting the data expired but gave back a stale response
              next_request = offset;
            }
          }

          /*console.log('---------------------------------------------');
          console.log('Current Data = ' + current_data.toISOString());
          if(this._lastGeneratedAtTime !== null) {
            console.log('Last generatedAtTime = ' + this._lastGeneratedAtTime.toISOString());
          }
          console.log('Max-Age = ' + max_age);
          console.log('Age = ' + age);
          console.log('Offset = ' + offset);
          console.log('Median Latency = ' + this._medianLatency);
          console.log('Cache Status = ' + x_proxy_cache);
          console.log('Next Request = ' + next_request);*/

          this.schedulePollRequest(url, new_headers, next_request, data_stream);

          // Only log new recieved data for benchmark porpouses
          if (this._lastGeneratedAtTime === null || this._lastGeneratedAtTime.getTime() !== current_data.getTime()) {
            this._lastGeneratedAtTime = current_data;
            // Register response time
            data_stream.responseTime = response_time;
            // Register cache bahaviour
            data_stream.x_proxy_cache = x_proxy_cache;
            // Write Log
            data_stream.write(body);
          }
        });
      });
    }, time);
  }

  openWebsocket(stream) {
    //Create stream
    var data_stream = new st.PassThrough();
    data_stream.streamId = stream.id;
    this.wss = new WebSocketStream(stream.accessUrl[0]);
    this.wss.pipe(data_stream);

    this.streamProtocolInUse = "ws";

    return data_stream;
  }

  findStreamById(id, streams) {
    for (let i in streams) {
      if (id === streams[i].id) {
        return streams[i];
      }
    }
    return null;
  }

  findStreamByProtocol(protocol, streams) {
    for (let i in streams) {
      if (protocol === streams[i].protocol) {
        return streams[i];
      }
    }
    return null;
  }

  getValueFromHeader(value, header) {
    for (let i in header) {
      if (header[i].trim().startsWith(value)) {
        return header[i].split('=')[1];
      }
    }
  }

  getGeneratedAtTime(rdf) {
    return new Promise((resolve, reject) => {
      this._n3Parser.parse(rdf.toString(), (error, triple, prefixes) => {
        if (triple && triple.predicate === "http://www.w3.org/ns/prov#generatedAtTime") {
          let n3Util = n3.Util;
          resolve(new Date(n3Util.getLiteralValue(triple.object)));
        }
      });
    });
  }

  median(array) {
    array.sort((a, b) => { return a - b; });
    let half = Math.floor(array.length / 2);

    if (array.length % 2) {
      return array[half];
    } else {
      return (array[half - 1] + array[half]) / 2;
    }
  }
};
