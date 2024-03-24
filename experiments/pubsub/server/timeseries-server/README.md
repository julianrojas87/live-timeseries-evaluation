# Time Series server

A NodeJS server that launches a real-time stream of data as Open Data.

Features:
 * Keeps and publishes history over HTTP using appropriate caching headers
 * Can expose a websocket stream
 * Adds metadata using Hydra

## Installation
Simply run `npm install` to install all necessary modules for the server to work.

## Testing
The server can be tested in several ways.

#### Using stub data
`npm run test-with-datagen` will instantiate a process that generates random stub
data every second and pipes it to the timeseries server, using `config.json`
in the root directory. By default, the data
will be saved in `out/data` (unless specified otherwise in `config.json`). If
this directory is not yet present, it will be created.

#### Without generating data
If data is present in the output directory specified in `config.json`, the server
can be run using this data without generating new data using
`npm run test-without-datagen`.

#### Using your own data
If you have a process (`data_proc`) that generates linked data to STDOUT, you can pipe it to
`timeseries-server` as follows:

`data_proc | node bin/timeseries-server.js [-c CONFIG_FILE]`

The data must be generated in one of the following formats:
Turtle, TriG, N-Triples, N-Quads, or Notation3 (N3).

## Configuration
- If a config file is passed using the `-c` flag, this file will be used
- If no `-c` flag is passed, `timeseries-server` looks for a `config.json`
in the root directory.
- If no `config.json` is found, default values for config fields are used.

Any fields not present in `config.json` will be instantiated to default
values. `config.json` can contain the following fields:

```js
{
    'maxFileSize': int (default: 500000)
    'outputDir': string (default: 'out')
    'staticData': string (default: '')
    'entry': string (default: '/entry')
    'fragment': string (default: '/fragment')
    'publishUrl': string (default: 'http://localhost:3000')
    'httpPort': int (default: 3000)
    "websocket": {
		"port": int (default: 3001)
	},
	"description":{
		"title": "Parking data.",
    		"description": "Parking data description.",
    		"topics": ["http://localhost:3000/#P10","http://localhost:3000/#P07"]
	},
	"streams":[
		{
			"port": "3000/#dataset",
			"protocol": "http",			
			"title": "Parking data poll.",
    			"description": "Parking data poll description.",
    			"license":  "https://creativecommons.org/licenses/by/4.0",
			"accessUrl": "http://localhost:3000/data"
		},
		{
			"port": "3001",
			"protocol": "ws",			
			"title": "Parking data stream.",
    			"description": "Parking data stream description.",
    			"license":  "https://creativecommons.org/licenses/by/4.0",
			"accessUrl": "ws://localhost:3001"
		}
	]
}
```

- `maxFileSize`: The maximum size (in bytes) of time series fragments in internal storage.
- `outputDir`: The output directory to write time series fragments to.
- `staticData`: (optional) The location of a static data file. The triples in this file
will be added to all responses (ideal for metadata that never changes and therefore should
not be saved to disk multiple times)
- `entry`: Default entry point (see further: HTTP Interface)
- `fragment`: Fragment entry point (see further: HTTP Interface)
- `publishUrl`: The URL under which the server will be published. This URL is used for any
self-referencing triples, e.g. hydra:previous and hydra:next links.
- `httpPort`: The port to run the HTTP server

## HTTP Interface
The HTTP interface defines two entry points:

- The default entry point: this entry point is specified in `config.json` as `entry`.
e.g. if `entry` is `/entry` and `publishUrl` is `localhost:3000`, then this entry
point can be addressed as `localhost:3000/entry`. The default entry point exposes the data for how to connect 
to the http or websocket stream.
- The fragment entry point: this entry point is specified in `config.json` as `fragment`.
All fragments are published under the fragment entry point. E.g. if `fragment` is `/fragment`
and `publishUrl` is `localhost:3000`, and there is a fragment called `2017-01-01T00:00:00Z`, then this
fragment can be addressed as `localhost:3000/fragment/2017-01-01T00:00:00Z`.
If a fragment is passed for which no file is present, this returns a `404` status code.


## Websockets Interface
The Websocket interface initiates on startup and will send data to its clients the moment a new chunk is generated. The interface will run on the `socketPort` port defined in the `config.json` file. Clients only have to connect via a websocket to the server's address and proces the messages the server sends.

### Client Example
This first client will handle the connection as a stream.
```javascript
//Websocket node module for streams
const WebSocket = require('websocket-stream');

//Create websocket and connect to the server
const ws = new WebSocket('ws://localhost:3001');

//Create a direct stream to stdout
ws.pipe(process.stdout);
```

The next client will handle the connection message by message.
```javascript
//Websocket node module
const WebSocket = require('ws');

//Create websocket and connect to the server
const ws = new WebSocket('ws://localhost:3001');

//When the client receive a message, print out the data
ws.on('message', function incoming(data) {
  console.log(data.toString());
});
```
