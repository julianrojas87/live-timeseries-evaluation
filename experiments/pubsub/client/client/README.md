# Linked Time Series client

Initiated with an entrypoint that contains VOIS metadata, it will get updates within a certain timeframe, or provide you with updates in a callback.

## Use it

```bash
npm install
```

If you have a timeseries-server up and running, you can perform queries as follows:

```bash
./bin/client.js -c <config file>
```

The times series server should return the next data on the address tat is specified in the ```config.catalogUrl``` config variable.
```
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix dcat: <http://www.w3.org/ns/dcat#>.

#Description of the dataset
<http://localhost:3000/#dataset> a dcat:Dataset;
    dct:title "Parking data.";
    dct:description "Parking data description.";
    foaf:topic <http://localhost:3000/#P10>,<http://localhost:3000/#P07>;
    dcat:distribution <http://localhost:3000/#distribution>, <ws://localhost:3001>.

#Description of the polling address
<http://localhost:3000/#distribution> a dcat:Distribution;
    dct:title "Parking data poll.";
    dct:description "Parking data poll description.";
    dct:license <https://creativecommons.org/licenses/by/4.0>.

#Description of the stream address
<ws://localhost:3001> a dcat:Distribution;
    dct:title "Parking data stream.";
    dct:description "Parking data stream description.";
    dct:license <https://creativecommons.org/licenses/by/4.0>.
```

Outputdata is of this form:
```
<chunk number> , <latency>
<chunk number> , <latency>
.
.
.
```

Because the way polling happens will change, the polling latency could be wrong.

### Config file
```
{
  "catalogUrl" : string, //Url to catalog
  "pollInterval" : int, //Interval to poll when polling.
  "preferredProtocol": string //Polling method, could be "http" or "ws"
}
```