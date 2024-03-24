FROM node:8
EXPOSE 3000

WORKDIR /app
ADD . /app

WORKDIR /app/replay-timeseries
RUN npm install

WORKDIR /app/timeseries-server
RUN npm install

WORKDIR /app
ENTRYPOINT ["./server.sh"]
