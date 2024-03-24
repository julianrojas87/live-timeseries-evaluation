# Replay Timeseries

Takes an RDF file of any kind (on disk) and replays it on standard ouput. Used for benchmarking purposes.

Install it as follows:
```
npm install -g replay-timeseries
```

Use it as follows:
```bash
cat rdfstream.trig | replay-timeseries --speed 2x
```

## An RDF stream

An RDF stream object is a named graph with elements as follows:
```
<a> <b> <c> <graph1> .
<...> <...> <...> <graph1> .
<graph1> <http://www.w3.org/ns/prov#generatedAtTime> "2017-..." .
```

## How it works

First it uses the <http://www.w3.org/ns/prov#generatedAtTime> (prov:generatedAtTime) property value of two adjacent graphs to determine the original stream frequency of the RDF stream. Then it will start writing on standard output every graph of the RDF stream based on the provided replay speed and setting the prov:generatedAtTime property of each graph containing the actual time of replay.