import express from "express";
import * as bodyParser from "body-parser";
import {Config} from "./Config";
import proxy from "http-proxy-middleware";
import {adminRoute} from "./AdminRoutes";

const _ = require('lodash');
const cors = require('cors');

process.on('uncaughtException', function (error) {
  console.error(error.message)
});

const port = 13399;

export class Api {
    public app: express.Application;

    constructor() {
        this.app = express();
    }

    public async start() {
        await this.config();
        this.addRoutes();
        this.launch();
    }

    private async config() {
        this.app.set("port", port);
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: false}));
        this.app.use(cors());
        const morgan = require('morgan');
        this.app.use(morgan('[:date[clf]] :method :url HTTP/:http-version :status :res[content-length] - :response-time ms'));
        // this.app.use(function (req, res, next) {
        //     res.setHeader('Access-Control-Allow-Origin', '*');
        //     res.setHeader(
        //         'Access-Control-Allow-Methods',
        //         'GET, POST'
        //     );
        //     res.setHeader(
        //         'Access-Control-Allow-Headers',
        //         'Access-Control-Allow-Headers, Origin, X-Requested-With, Content-Type, Accept, Authorization'
        //     );
        //     next();
        // });

    }

    private addRoutes(): void {
        this.app.use("/admin", adminRoute);
        const conf = {
            changeOrigin: true,
            onProxyReq: this.onProxyReq,
            onProxyRes: this.onProxyRes,
            onError: this.onError,
        };

        this.app.use('/wallet', proxy({
            ...conf,
            target: Config.network.fullNode,
        }));
        this.app.use("/walletsolidity", proxy({
            ...conf,
            target: Config.network.solidityNode,
        }));
    }

    onProxyReq(proxyReq, req, res) {
        let qs = false;
        let options = Config.options;

        if (options.verbose) {
            if (options.showQueryString && _.keys(req.query).length) {
                qs = true;
                console.log('\n');
                console.log(JSON.stringify(req.query, null, options.formatJson ? 2 : null));
            }

            if (options.showBody && req.method === "POST" && _.keys(req.body).length) {
                if (!qs) {
                    console.log('\n');
                }
                console.log(JSON.stringify(req.body, null, options.formatJson ? 2 : null));
            }
        }

        if (req.method === "POST") {
            let bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    }

    onProxyRes(proxyRes, req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');

        const options = Config.options;

        if (options.verbose) {
            const oldWrite = res.write,
                oldEnd = res.end;

            const chunks = [];

            res.write = function (chunk) {
                chunks.push(chunk);

                oldWrite.apply(res, arguments);
            };

            res.end = function (chunk) {

                if (chunk)
                    chunks.push(chunk);

                let body = Buffer.concat(chunks).toString('utf8').replace(/\n+$/g, '');
                console.log(options.formatJson ? JSON.stringify(JSON.parse(body), null, 2) : body);

                oldEnd.apply(res, arguments);
            };
        }
    }

    onError(err, req, res) {
        res.writeHead(500, {
            'Content-Type': 'text/plain'
        });
        res.end(err.toString());
    }

    private launch(): void {
        this.app.listen(this.app.get("port"), () => {
            console.log(`App is running in port ${this.app.get("port")} and ${this.app.get("env")} mode`);
            console.log("Press CTRL-C to stop\n");
        });
    }
}

const api = new Api();

api.start();

