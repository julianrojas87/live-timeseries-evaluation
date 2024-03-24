const fs = require('fs');
const n3u = require('n3').Util;

function getConfig(argv) {
    // Get configuration
    if (argv.length === 4) {
        if (argv[2] === '-c') {
            try {
                let raw = fs.readFileSync(argv[3]);
                return JSON.parse(raw);
            } catch (e) {
                console.error(e);
                process.exit(1);
            }
        }
    } else {
        if (fs.exists('config.json')) {
            let raw = fs.readFileSync(argv[3]);
            return JSON.parse(raw);
        } else {
            return {
                'maxFileSize': 500000,
                'outputDir': 'out',
                'staticData': '',
                'entry': '/entry',
                'fragment': '/fragment',
                'publishUrl': 'http://localhost:3000',
                'httpPort': 3000
            }
        }
    }
}

function getPrefixes() {
    return {
        'hydra': 'http://www.w3.org/ns/hydra/core#'
    }
}

function getStreamDescription(config) {
    let triples = [];
    triples.push({
        subject: config.dataset.id,
        predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        object: "dcat:Dataset"
    });
    triples.push({
        subject: config.dataset.id,
        predicate: "dct:title",
        object: n3u.createLiteral(config.dataset.title)
    });
    triples.push({
        subject: config.dataset.id,
        predicate: "dct:description",
        object: n3u.createLiteral(config.dataset.description)
    });
    for (let i in config.dataset.topics) {
        triples.push({
            subject: config.dataset.id,
            predicate: "foaf:topic",
            object: config.dataset.topics[i]
        });
    }

    for (let i in config.streams) {
        triples.push({
            subject: config.dataset.id,
            predicate: "dcat:distribution",
            object: config.streams[i].id
        });
        triples.push({
            subject: config.streams[i].id,
            predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            object: "dcat:Distribution"
        });

        triples.push({
            subject: config.streams[i].id,
            predicate: "dct:title",
            object: n3u.createLiteral(config.streams[i].title)
        });
        triples.push({
            subject: config.streams[i].id,
            predicate: "dct:description",
            object: n3u.createLiteral(config.streams[i].description)
        });
        triples.push({
            subject: config.streams[i].id,
            predicate: "dct:license",
            object: config.streams[i].license
        });
        triples.push({
            subject: config.streams[i].id,
            predicate: "http://example.org/timesync",
            object: config.streams[i].timesync
        });
        triples.push({
            subject: config.streams[i].id,
            predicate: "dcat:accessURL",
            object: config.streams[i].accessUrl
        });
    }

    return triples;
}

function url(filename, config) {
    return config.publishUrl + config.fragment + '/' + filename;
}

module.exports = {
    getConfig: getConfig,
    getPrefixes: getPrefixes,
    getStreamDescription: getStreamDescription,
    url: url
};
