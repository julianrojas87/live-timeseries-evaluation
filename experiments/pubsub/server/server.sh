#!/bin/bash

#LDREPLAYSPEED=10
echo "Ld replay speed is ${LDREPLAYSPEED}"

cat ./data/city_0_parking_data.trig | ./replay-timeseries/bin/replay-timeseries.js --speed ${LDREPLAYSPEED}x | node timeseries-server/bin/timeseries-server.js -c ts-server-config.json