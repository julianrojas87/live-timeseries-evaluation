const utils = require('./tripleutils.js');

class Dataset {
    constructor(id, triples) {
        this.id = id;
        this.title = utils.getObjects(id, "http://purl.org/dc/terms/title", triples);
        this.description = utils.getObjects(id, "http://purl.org/dc/terms/description", triples);
        this.topics = utils.getObjects(id, "http://xmlns.com/foaf/0.1/topic", triples);
        this.distributions = utils.getObjects(id, "http://www.w3.org/ns/dcat#distribution", triples);
        this.streams = [];
    }
}

class Stream {
    constructor(id, triples) {
        this.id = id;
        this.title = utils.getObjects(id, "http://purl.org/dc/terms/title", triples);
        this.description = utils.getObjects(id, "http://purl.org/dc/terms/description", triples);
        this.license = utils.getObjects(id, "http://purl.org/dc/terms/license", triples);
        this.timesync = utils.getObjects(id, "http://example.org/timesync", triples)[0];
        this.accessUrl = utils.getObjects(id, "http://www.w3.org/ns/dcat#accessURL", triples);
        //Protocol always get specified first
        this.protocol = this.accessUrl[0].split("://")[0];
    }
}

module.exports = {
    Dataset,
    Stream
}
