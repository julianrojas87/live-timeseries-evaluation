#!/usr/bin/env node

const split = require('split');
const fs = require('fs');
var program = require('commander');

program
    .option('-p, --path <path>', 'Path to a CSV file that will contain the Docker stats (Default: result.csv)')
    .parse(process.argv);

var path = program.path || 'result.csv';
var ws = fs.createWriteStream(path);
var first = true;

process.stdin.setEncoding('utf8');
process.stdin.pipe(new split()).on('data', line => {
    let regex = /("[^"]+"|[^"\s]+)/g;
    if (!line.startsWith('CONTAINER')) {
        let stats = line.match(regex);
        let time = new Date();
        time.setUTCMilliseconds(0);
        let log = time.toISOString() + ',' + stats[0] + ',' + stats[1] + ',' + stats[2].slice(0, -1) + ',' 
            + stats[3].slice(0, -3) + ',' + stats[5].slice(0, -3) + '\n';
        ws.write(log);
    } else {
        if (first) {
            let headers = line.match(regex);
            let header = 'TIMESTAMP,' + headers[0] + ',' + headers[1] + ',' + headers[2] + '%,' + headers[4] + ' ' 
                + headers[5] + ' (MiB),' + headers[7] + ' (GiB)\n';
            ws.write(header);
            first = false;
        }
    }
});