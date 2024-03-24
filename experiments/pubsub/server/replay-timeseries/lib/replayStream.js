const Writable = require('stream').Writable;
const N3 = require('n3');
var N3Util = N3.Util;

class ReplayStream extends Writable {
    constructor(speed) {
        super({ objectMode: true });
        this._speed = speed || 1;
        this._rdfWriter = N3.Writer();
        this._original_pace = 0;
        this._replay_pace = 0;
        this._time_reference = null;
        this._first_chunk = [];
        this._second_chunk = [];
    }

    async _write(triple, encoding, done) {
        try {
            // First calculate original stream frequency by capturing the first 2 chunks
            if (this.original_pace === 0) {
                // Getting the first chunk
                if (this.time_reference === null) {
                    if (triple.predicate === 'http://www.w3.org/ns/prov#generatedAtTime') {
                        // First generatedAtTime variable
                        this.time_reference = new Date(triple.object.split('"')[1]);
                        this.first_chunk.push(triple);
                    } else {
                        // Store triple and continue until the first generatedAtTime
                        this.first_chunk.push(triple);
                    }
                    done();
                } else {
                    // Getting the second chunk
                    if (triple.predicate === 'http://www.w3.org/ns/prov#generatedAtTime') {
                        this.second_chunk.push(triple);
                        // Second generatedAtTime variable
                        let t1 = new Date(triple.object.split('"')[1]);
                        // Calculate original frequency and replay requency
                        this.original_pace = t1.getTime() - this.time_reference.getTime();
                        this.replay_pace = this.original_pace / this.speed;

                        // Prepare to replay first chunk and set its new generatedAtTime
                        let first = await this.parseChunk(this.first_chunk);
                        // Replay the first chunk
                        console.log(first);

                        // Schedule the replay of the second chunk in (replay_pace) ms
                        setTimeout(async () => {
                            // Prepare to replay second chunk and set its new generatedAtTime
                            let second = await this.parseChunk(this.second_chunk);
                            // Replay the second chunk
                            console.log(second);
                            done();
                        }, this.replay_pace);
                    } else {
                        // Read triple and continue until the second generatedAtTime
                        this.second_chunk.push(triple);
                        done();
                    }
                }
            } else {
                // Replay frequency is known now, then gather the next chunk and replay it accordingly
                if (triple.predicate === 'http://www.w3.org/ns/prov#generatedAtTime') {
                    setTimeout(() => {
                        triple.object = N3Util.createLiteral(new Date().toISOString(), 'http://www.w3.org/2001/XMLSchema#dateTime');
                        this.rdfWriter.addTriple(triple);
                        this.rdfWriter.end((error, result) => {
                            console.log(result);
                            this.rdfWriter = N3.Writer();
                            done();
                        });
                    }, this.replay_pace);
                } else {
                    this.rdfWriter.addTriple(triple);
                    done();
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    parseChunk(chunk) {
        return new Promise((resolve, reject) => {
            for (let i = 0; i < chunk.length; i++) {
                if (i == (chunk.length - 1)) {
                    chunk[i].object = N3Util.createLiteral(new Date().toISOString(), 'http://www.w3.org/2001/XMLSchema#dateTime');
                }
                this.rdfWriter.addTriple(chunk[i]);
            }

            this.rdfWriter.end((error, result) => {
                if (error) reject(error);
                this.rdfWriter = N3.Writer();
                resolve(result);
            });
        });
    }

    get speed() {
        return this._speed;
    }

    get rdfWriter() {
        return this._rdfWriter;
    }

    set rdfWriter(writer) {
        if (writer) this._rdfWriter = writer;
    }

    get original_pace() {
        return this._original_pace;
    }

    set original_pace(pace) {
        if (pace) this._original_pace = pace;
    }

    get replay_pace() {
        return this._replay_pace;
    }

    set replay_pace(pace) {
        if (pace) this._replay_pace = pace;
    }

    get time_reference() {
        return this._time_reference;
    }

    set time_reference(time) {
        if (time) this._time_reference = time;
    }

    get first_chunk() {
        return this._first_chunk;
    }

    get second_chunk() {
        return this._second_chunk;
    }
}

module.exports = ReplayStream;