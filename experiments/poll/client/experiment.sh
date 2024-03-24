#!/bin/bash

if [ "$#" -ne 4 ]; then
    echo "Usage: ./experiment.sh MIN MAX INCR TIME"
else
    node client-exp.js $1 $2 $3 $4  # min, max, increase (amount of clients)
fi
