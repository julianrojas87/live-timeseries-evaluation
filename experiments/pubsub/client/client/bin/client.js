#!/usr/bin/node

var Client = require('../lib/lts-client.js'),
  path = require('path'),
  fs = require('fs'),
  program = require('commander'),
  n3parser = require('n3').Parser(),
  n3util = require('n3').Util;



program
  .version('0.1.0')
  .option('-c --config [file]', 'specify config file')
  .parse(process.argv);

if (program.config) {
  var configFile = program.config;
  var config = JSON.parse(fs.readFileSync(configFile, { encoding: 'utf8' }));
  var client = new Client(config);

  runClient(client);
} else {
  console.error("Please provide a valid config file. Use --help for detailed instructions.");
  process.exit();
}

async function runClient(client) {
  try {
    // Get provided datasets and its available streams 
    let catalog = await client.getCatalog();
    console.log('TIMESTAMP,', 'STREAM ID,', 'MODE,', 'DATA SIZE (bytes),', 'DATA GENERATED AT,', 'PROXY CACHE,', 'LATENCY (ms)');
    // Try to subscribe/consume available streams from each dataset according to the preferred method  
    catalog.forEach(async (dataset) => {
      try {
        let stream = await client.subscribe(dataset);

        stream.on('data', async (data) => {
          // Register data reception
          if (client.streamProtocolInUse === 'ws') {
            let receive_time = new Date();
            receive_time.setTime(receive_time.getTime() - client._clockDifference);
            let generatedTime = await client.getGeneratedAtTime(data.toString());
            let protocol = 'WebSocket';
            let latency = Math.abs(receive_time - generatedTime);
            receive_time.setUTCMilliseconds(0);
            // Log measurements to standard output
            console.log(receive_time.toISOString() + ',', stream.streamId + ',', protocol + ',', Buffer.byteLength(data.toString(), 'utf8')
              + ',', generatedTime.toISOString() + ',', '--,', latency);
          } else {
            let receive_time = stream.responseTime || new Date();
            let generatedTime = new Date(client._lastGeneratedAtTime.getTime() + client._clockDifference);
            let protocol = 'HTTP';
            let logTime = new Date(receive_time.getTime() - client._clockDifference);
            logTime.setUTCMilliseconds(0);
            // Log measurements to standard output
            console.log(logTime.toISOString() + ',', stream.streamId + ',', protocol + ',', Buffer.byteLength(data.toString(), 'utf8')
              + ',', client._lastGeneratedAtTime.toISOString() + ',', stream.x_proxy_cache + ',', Math.abs(receive_time - generatedTime));
          }
        });
      } catch (err) {
        console.error(err);
      }
    });
  } catch (err) {
    console.error(err);
  }
}
