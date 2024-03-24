const cp = require('child_process');
const mkdirp = require('mkdirp');

let min = parseInt(process.argv[2]);
let max = parseInt(process.argv[3]);
let incr = parseInt(process.argv[4]);
let time = parseInt(process.argv[5]);

function experiment(amount) {
    console.log("Starting", amount, "processes...");
    dirname = './results/' + amount + '/'
    mkdirp.sync(dirname)
    let procs = []

    for (let i = 0; i < amount; i++) {
        procs.push(cp.exec('node ./client/bin/client.js -c config.json > ' + dirname + 'client-' + i + '.csv'));
    } 

    setTimeout(() => {
        procs.forEach(p => {
            p.kill('SIGINT');
        });
        console.log("Killed", amount, "clients");
        if (amount + incr <= max) {
            console.log("Setting timeout for", amount + incr);
            setTimeout(() => {
                experiment(amount + incr);
            }, 1000)
        } else {
            console.log('Experiment completed successfuly use <ctrl + c> to finish this process');
        }
    }, time * 1000)
}

experiment(min);
