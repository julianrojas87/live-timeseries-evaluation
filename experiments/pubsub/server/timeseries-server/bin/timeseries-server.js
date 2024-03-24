const Koa = require('koa');
const Router = require('koa-router');
const moment = require('moment');
const md5 = require('md5');
const ws = require('ws');
const fs = require('../lib/Filesystem');
const configuration = require('../lib/configuration');

const app = new Koa();
const router = new Router();

// Read config file
let config = configuration.getConfig(process.argv);
let ldfs = new fs(config);
let last_data = null;

// Root entry point
router.get(config.entry, (ctx, next) => {
    ldfs.getStreamDescription(config, (err, res) => {
        ctx.response.body = res;
        ctx.response.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/turtle'
        });
    });
});

router.get('/timesync', (ctx, next) => {
    ctx.response.set({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'text/plain'
    });
    ctx.body = new Date().toISOString();
});

router.get("/data", (ctx, next) => {
    if (ldfs.last_gat === null) {
        ctx.response.status = 404;
        ctx.response.body = "No data found";
    } else {
        let etag = 'W/"' + md5(ldfs.last_gat) + '"';
        let ifNoneMatchHeader = ctx.request.header['if-none-match'];
        let maxage = ldfs.calculateMaxAge();
        let expires = ldfs.calculateExpires();
        let last_modified = ldfs.last_gat.toUTCString();

        if (ifNoneMatchHeader && ifNoneMatchHeader === etag) {
            ctx.response.status = 304;
        } else {
            ldfs.addHydraLinksToData(last_data, (err, res) => {
                if (err) {
                    ctx.response.status = 404;
                    ctx.response.body = "No data found";
                } else {
                    ctx.response.set({
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'public, s-maxage=' + (maxage - 1) + ', max-age=' + maxage + ', must-revalidate',
                        //'ETag': etag,
                        'Expires': expires,
                        'Last-Modified': last_modified,
                        'Content-Type': 'application/trig',
                    });
                    ctx.response.body = res;
                }
            });
        }
    }
});

// Fragment entry point
router.get(config.fragment + '/:ts', (ctx, next) => {
    ldfs.getFragment(ctx.params['ts'], 'application/trig', (err, res) => { // TODO content negotiation
        if (res) {
            ctx.response.body = res;
            ctx.response.set({
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'max-age=' + ldfs.getCacheTime(ctx.params['ts']),
                'Content-type': 'application/trig'
            });
        } else {
            ctx.response.status = 500;
            ctx.response.body = "Internal server error.";
        }
        next();
    }, () => {
        ctx.response.status = 404;
        ctx.response.body = "Page " + ctx.params['ts'] + " not found.";
    });
});

// Listening to stdin
let stdin = process.openStdin();

// Write chunk to disk
stdin.on('data', chunk => {
    // Calculate data period
    ldfs.setDataPeriod(chunk.toString());
    // Write data into store files
    ldfs.writeEntry(chunk.toString());
    // Keep last chunk on memory
    last_data = chunk;
});

if (config.websocket) {
    //Create websocket
    let websocket = new ws.Server({ port: config.websocket.port });

    stdin.on('data', chunk => {
        //Send the chunk to all clients
        websocket.clients.forEach((client) => {
            //Check if the connection is open
            if (client.readyState === ws.OPEN) {
                ldfs.addHydraLinksToData(chunk, (err, res) => {
                    client.send(res);
                });
            }
        });
    });
}

// Launch server
app.use(router.routes()).use(router.allowedMethods());

app.listen(config.httpPort);
