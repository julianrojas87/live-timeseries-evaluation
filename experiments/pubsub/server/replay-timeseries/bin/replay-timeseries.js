#!/usr/bin/env node

const N3 = require('n3');
const ReplayStream = require('../lib/replayStream');

var program = require('commander');

program
    .version('0.0.1')
    .option('-s, --speed <speed>', 'Define replay speed (2x, 5x, 10x...) of the data stream (default: 1x, means that is replayed with original frequency)')
    .parse(process.argv);


if (program.speed) {
    var speed = program.speed.split('x')[0];

    if (speed && !/\D/.test(speed)) {
        var streamParser = N3.StreamParser();
        var streamWriter = new N3.StreamWriter();
        var stdin = process.stdin;

        stdin.pipe(streamParser);
        streamParser.pipe(new ReplayStream(speed));
    } else {
        console.error('Please provide a valid speed argument (e.g. -s 3x). Use --help for detailed instructions');
        process.exit();
    }
} else {
    console.error('Please provide a valid speed argument (e.g. -s 3x). Use --help for detailed instructions');
    process.exit();
}