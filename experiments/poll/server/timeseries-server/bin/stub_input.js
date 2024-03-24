const N3 = require('n3');
const moment = require('moment');

function genTriples(amountPerSec) {
  let triples = [];
  for (let i = 0; i < amountPerSec; i++) {
    triples.push(genTriple());
  }

  let now = moment().unix();
  triples.push({
    subject: 'http://www.example.org/' + now,
    predicate: 'http://www.w3.org/ns/prov#generatedAtTime',
    object: N3.Util.createLiteral(new Date().toISOString())
  });

  let writer = N3.Writer();
  writer.addTriples(triples);
  writer.end((err, res) => console.log(res));
  setTimeout(() => genTriples(amountPerSec), 1000);
}

function genTriple() {
  let rand = Math.floor(Math.random() * 100000);
  let now = moment().unix();
  return {
    subject: 'http://example.org/' + now,
    predicate: 'http://example.org/hasValue',
    object: N3.Util.createLiteral(rand)
  }
}

genTriples(10);
