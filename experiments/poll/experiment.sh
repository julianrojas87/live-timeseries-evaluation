#!/bin/bash

rm -rf results
mkdir results
docker-compose build
docker-compose up &  # Start server
./recordstats.sh | docker-stats/bin/docker-stats.js -p results/result.csv   # Record stats
RECORD_ID=$!  # Save PID to kill script
docker-compose down  # Kill server
kill -9 $RECORD_ID  # Kill recordstats script
