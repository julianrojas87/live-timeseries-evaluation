const fs = require('fs');
const path = require('path');
const n3 = require('n3');
const n3u = n3.Util;
const lodash = require('lodash');
const moment = require('moment');
const mkdirp = require('mkdirp');

const configuration = require('./configuration');

class Filesystem {
    constructor(config) {
        this.outDir = config.outputDir;
        this.staticData = config.staticData;
        this.maxFileSize = config.maxFileSize;
        this.config = config;
        if (!fs.existsSync(this.outDir)) {
            mkdirp.sync(this.outDir);
        }
        this.files = fs.readdirSync(this.outDir);
        this.last_gat = null;
        this.data_period = null;
    }

    getFile(timestamp) {
        let index = lodash.sortedIndex(this.files, timestamp);
        if (index >= 0) {
            if (this.files[index] === timestamp) {
                return this.files[index];
            }
            return this.files[index - 1];
        } else {
            return null;
        }
    }

    writeEntry(entry) {
        let parser = n3.Parser();
        let writer = n3.Writer({ format: 'application/trig' });
        let triples = parser.parse(entry);
        writer.addTriples(triples);
        writer.end((err, res) => {
            console.log(res);
            if (this.files.length > 0) {
                let last_file = path.join(this.outDir, this.files[this.files.length - 1]);
                if (fs.statSync(last_file).size + res.length > this.maxFileSize) {
                    let now = (new Date()).getTime().toString();
                    this.files.push(now);
                    //Create the file if it doesn't exist yet
                    fs.closeSync(fs.openSync(path.join(this.outDir, now), 'a'));
                    fs.writeFileSync(path.join(this.outDir, now), res);
                } else {
                    fs.appendFileSync(last_file, res);
                }
            } else {
                let now = (new Date()).getTime().toString();
                this.files.push(now);
                //Create the file if it doesn't exist yet
                fs.closeSync(fs.openSync(path.join(this.outDir, now), 'a'));
                fs.writeFileSync(path.join(this.outDir, now), res);
            }
        });
    }

    getHydraLinks(filename) {
        let index = lodash.sortedIndexOf(this.files, filename);
        let result = {};
        if (index === -1) {
            throw ("File does not exist: " + filename);
        }
        if (index !== 0) {
            result.previous = this.files[index - 1];
        }
        if (index !== this.files.length - 1) {
            result.next = this.files[index + 1];
        }
        return result;
    }

    getStaticData() {
        if (this.staticData !== '') {
            return fs.readFileSync(this.staticData);
        }
        return null;
    }

    getStreamDescription(config, writeCallback) {
        let triples = configuration.getStreamDescription(config);

        let writer = n3.Writer();
        writer.addPrefixes({
            "foaf": "http://xmlns.com/foaf/0.1/",
            "dct": "http://purl.org/dc/terms/",
            "dcat": "http://www.w3.org/ns/dcat#"
        });
        writer.addTriples(triples);

        writer.end(writeCallback);
    }

    addHydraLinksToData(data, writerCallback) {
        if (data !== null) {
            let writer = n3.Writer();
            writer.addPrefixes(configuration.getPrefixes());
            let parser = n3.Parser();

            // Get static data if available
            let staticData = this.getStaticData();
            if (staticData) {
                let triples = parser.parse(staticData.toString());
                writer.addTriples(triples);
            }

            //Add the data
            let triples = parser.parse(data.toString());
            writer.addTriples(triples);

            //Look for the fragment this data is from
            let filename = null;
            for (let i in triples)
                if (triples[i].predicate === "http://www.w3.org/ns/prov#generatedAtTime")
                    filename = this.getFile(n3u.getLiteralValue(triples[i].object));

            let link = this.getHydraLinks(filename);

            if (link.previous) {
                let sub = configuration.url(filename, this.config);
                let obj = configuration.url(link.previous, this.config);
                writer.addTriple(sub, 'hydra:previous', obj);
            }

            writer.end(writerCallback);
        } else {
            writerCallback(new Error);
        }
    }


    getFragment(filename, contentType, writerCallback, errorCallback) {
        if (lodash.sortedIndexOf(this.files, filename) !== -1) {
            let writer = n3.Writer({ format: contentType });
            writer.addPrefixes(configuration.getPrefixes());
            let parser = n3.Parser();

            // Get static data if available
            let staticData = this.getStaticData();
            if (staticData) {
                let triples = parser.parse(staticData.toString());
                writer.addTriples(triples);
            }

            // Get contents
            let contents = fs.readFileSync(path.join(this.outDir, filename));
            let triples = parser.parse(contents.toString());
            writer.addTriples(triples);

            // Get hydra links
            let links = this.getHydraLinks(filename);
            ['previous', 'next'].forEach(link => {
                if (links[link]) {
                    let sub = configuration.url(filename, this.config);
                    let obj = configuration.url(links[link], this.config);
                    writer.addTriple(sub, 'hydra:' + link, obj);
                }
            });

            writer.end(writerCallback);
        } else {
            errorCallback();
        }
    }

    getCacheTime(filename) {
        let index = lodash.sortedIndexOf(this.files, filename);
        if (index !== -1) {
            return index === this.files.length - 1 ? 30 : 31536000
        }
        throw ("File does not exist: " + filename);
    }

    setDataPeriod(chunk) {
        let parser = n3.Parser();
        let triples = parser.parse(chunk);
        let ld = null;

        for (let i in triples) {
            if (triples[i].predicate === 'http://www.w3.org/ns/prov#generatedAtTime') {
                ld = new Date(n3u.getLiteralValue(triples[i].object));
                break;
            }
        }

        if (this.last_gat != null) {
            this.data_period = ld.getTime() - this.last_gat.getTime();
        }

        this.last_gat = ld;
    }

    calculateMaxAge(req_date) {
        if(this.last_gat !== null && this.data_period !== null) {
            let now = new Date();
            let max = new Date(this.last_gat.getTime() + this.data_period);
            let max_age = Math.ceil((max.getTime() - now.getTime()) / 1000);
            return max_age;
        } else {
            return 1;
        }
    }

    calculateExpires() {
        if(this.last_gat !== null && this.data_period !== null) {
            return new Date(this.last_gat.getTime() + this.data_period).toISOString();
        } else {
            let now = new Date();
            return new Date(now.getTime() + 1000).toISOString();
        }
    }
}

module.exports = Filesystem;
