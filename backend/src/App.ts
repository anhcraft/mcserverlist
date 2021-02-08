import express from "express";
import * as http from 'http';
import axios from "axios";
import {TokenCache} from "./cache/TokenCache";
import {UserCache} from "./cache/UserCache";
import {UserStorage} from "./storage/UserStorage";
import {ServerStorage} from "./storage/ServerStorage";
import {ServerCache} from "./cache/ServerCache";
import {User} from "./struct/User";
import {PingInfoCache} from "./cache/PingInfoCache";
import {Server} from "./struct/Server";
import {cyrb53} from "./utils/Hash";
import {config} from "./Config";
import crypto from "crypto";
import bodyParser from "body-parser";
import rateLimit from "express-rate-limit";
import marked from "marked";
import morgan from "morgan";

const tokenCache = new TokenCache();
const userCache = new UserCache(new UserStorage());
const serverStorage = new ServerStorage();
const serverCache = new ServerCache(serverStorage);
const pingInfoCache = new PingInfoCache();

setInterval(function (){
    serverCache.saveAll();
    userCache.saveAll();
}, 1000 * 60 * 60);
const limiter = rateLimit({
    windowMs: config.rate_limit_duration,
    max: config.rate_limit_amount,
    message: "Lỗi: Đã có quá nhiều lượt truy cập cùng lúc! Vui lòng thử lại sau."
});
const app: express.Application = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(morgan(config.in_dev ? 'dev' : 'common'));
app.use(limiter);
app.use(function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', config.in_dev ? '*' : 'https://minecraftvn.net');
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers,Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});
const server: http.Server = http.createServer(app);
server.listen(config.serverPort);

app.get('/system/save/:id', (req, res) => {
    if(req.params.id === config.private_save_key) {
        serverCache.saveAll();
        userCache.saveAll();
        res.json({
            success: true
        });
    } else {
        res.json({
            success: false
        });
    }
});

app.post('/auth/check', (req, res) => {
    res.json({
        logged_in: tokenCache.isValidToken(req.body.uid, req.body.utk)
    });
});

app.post('/auth/login', (req, res) => {
    let json: any = {
        code: 0,
        msg: ""
    };

    if (req.body.login === undefined || req.body.login.length <= 3) {
        json.code = 1;
        json.msg = "Tài khoản quá ngắn!";
        res.json(json);
        return;
    }

    if (req.body.password === undefined || req.body.password.length <= 5) {
        json.code = 1;
        json.msg = "Mật khẩu quá ngắn!";
        res.json(json);
        return;
    }

    axios.post(config.xenforo_auth_url, `login=${req.body.login}&password=${req.body.password}`, {
        headers: {
            'XF-Api-Key': config.xenforo_api_key
        },
        validateStatus: () => true
    }).then((authRes) => {
            json.code = 1;
            if (authRes.status === 400) {
                json.msg = authRes.data.errors[0].message;
                res.json(json);
                return;
            } else if (authRes.status !== 200) {
                json.msg = "Backend error! #1";
                res.json(json);
                return;
            }
            if (!authRes.data.success) {
                json.msg = "Backend error! #2";
                res.json(json);
                return;
            }
            if (authRes.data.user.user_state !== 'valid') {
                json.msg = "Tài khoản của bạn chưa được xác nhận!";
                res.json(json);
                return;
            }
            const uid = authRes.data.user.user_id;
            userCache.request(uid, function (id: string) {
                return new User(id);
            }, function (user: User) {
                user.username = authRes.data.user.username;
                user.lastLogin = (new Date).getTime();
                userCache.set(uid, user);
                json.uid = uid;
                json.utk = tokenCache.generateToken(uid);
                json.code = 2;
                res.json(json);
            });
        }).catch((err) => {
            console.log(err);
            json.code = 0;
            res.json(json);
        });
});

app.post('/auth/logout', (req, res) => {
    const uid = req.body.uid;
    if(tokenCache.isValidToken(uid, req.body.utk)) {
        tokenCache.destroyToken(uid);
        res.json({
            code: 1
        });
    } else {
        res.json({
            code: 0
        });
    }
});

app.get('/server/ping', (req, res) => {
    let json = {
        servers: [] as string[]
    };
    const serverIdListQuery = req.query.servers;
    if (serverIdListQuery === undefined) {
        res.json(json);
        return;
    }
    const serverIds = (serverIdListQuery as String).split(",");
    let packageSize = 0;
    const packageHandler = (item: any) => {
        json.servers.push(item);
        if (++packageSize == serverIds.length) {
            res.json(json);
        }
    };
    for (let i = 0; i < serverIds.length; i++) {
        const id = serverIds[i];
        serverCache.request(id, null, function (server: Server) {
            const data = {
                success: false,
                index: i,
                result: {}
            };
            if (server == undefined) {
                packageHandler(data);
            } else {
                const ip = server.diffPing ? server.pingIp : server.ip;
                const port = server.diffPing ? server.pingPort : server.port;
                pingInfoCache.request(ip, port, function (res: any) {
                    if(res !== undefined) {
                        data.success = true;
                        data.result = res;
                    }
                    packageHandler(data);
                });
            }
        })
    }
});

app.get('/server/get', (req, res) => {
    let json = {
        code: 0,
        servers: [] as any[]
    };

    const amountQuery = req.query.amount as string;
    const fromQuery = req.query.from as string;
    const paramListQuery = req.query.params as string;
    const amount = amountQuery === undefined ? config.default_server_get_amount : parseInt(amountQuery);
    const from = fromQuery === undefined ? 0 : parseInt(fromQuery);
    const params = paramListQuery === undefined ? ["name"] : paramListQuery.split(",");

    const all = serverStorage.list();
    if(all.length > 0) {
        json.code = all.length > from + amount ? 2 : 1;
        const next = function (i: number) {
            serverCache.request(all[i], null, function (server: Server) {
                if(server != undefined) {
                    let result = {};
                    for(const key in server) {
                        if (server.hasOwnProperty(key) && params.includes(key)) {
                            result[key] = server[key];
                        }
                    }
                    if (result.hasOwnProperty("intro")) {
                        result["intro"] = marked(result["intro"], {
                            breaks: true,
                            silent: true,
                            xhtml: true
                        });
                    }
                    json.servers.push(result);
                }
                if(json.servers.length < amount && i + 1 < all.length) {
                    next(i + 1);
                } else {
                    res.json(json);
                }
            });
        };
        next(from);
    } else {
        res.json(json);
    }
});

app.post('/server/get', (req, res) => {
    let json = {
        code: 0,
        servers: [] as any[]
    };
    const uid = req.body.uid;

    if(!tokenCache.isValidToken(uid, req.body.utk)) {
        res.json(json);
        return;
    }

    const amountQuery = req.body.amount as string;
    const fromQuery = req.body.from as string;
    const paramListQuery = req.body.params as string;
    const amount = amountQuery === undefined ? config.default_owned_server_get_amount : parseInt(amountQuery);
    const from = fromQuery === undefined ? 0 : parseInt(fromQuery);
    const params = paramListQuery === undefined ? ["name"] : paramListQuery.split(",");

    const all = serverStorage.list();
    if(all.length > 0) {
        json.code = all.length > from + amount ? 2 : 1;
        const next = function (i: number) {
            serverCache.request(all[i], null, function (server: Server) {
                if(server != undefined && server.creator == uid) {
                    let result = {};
                    for(const key in server) {
                        if (server.hasOwnProperty(key) && params.includes(key)) {
                            result[key] = server[key];
                        }
                    }
                    if (result.hasOwnProperty("intro")) {
                        result["intro"] = marked(result["intro"], {
                            breaks: true,
                            silent: true,
                            xhtml: true
                        });
                    }
                    json.servers.push(result);
                }
                if(json.servers.length < amount && i + 1 < all.length) {
                    next(i + 1);
                } else {
                    res.json(json);
                }
            });
        };
        next(from);
    } else {
        res.json(json);
    }
});

app.get('/server/get/:id', limiter, (req, res) => {
    let json = {
        code: 0,
        msg: "",
        server: {}
    };

    const id = req.params.id;
    if(id == undefined) {
        res.json(json);
        return;
    }
    json.code = 1;

    const paramListQuery = req.query.params as string;
    const params = paramListQuery === undefined ? ["name"] : paramListQuery.split(",");

    serverCache.request(id, null, function (server: Server) {
        if(server != undefined) {
            json.code = 2;
            let result = {};
            for(const key in server) {
                if (server.hasOwnProperty(key) && params.includes(key)) {
                    result[key] = server[key];
                }
            }
            if (result.hasOwnProperty("intro")) {
                result["intro"] = marked(result["intro"], {
                    breaks: true,
                    silent: true,
                    xhtml: true
                });
            }
            json.server = result;
        }
        res.json(json);
    });
});

app.post('/server/remove/:id', (req, res) => {
    let json = {
        code: 0,
        msg: ""
    };
    const uid = req.body.uid;
    if(!tokenCache.isValidToken(uid, req.body.utk)) {
        res.json(json);
        return;
    }
    const id = req.params.id;
    if(id == undefined) {
        res.json(json);
        return;
    }
    json.code = 1;

    serverCache.request(id, null, function(server: Server){
        if(server == undefined) {
            json.msg = "Backend error! #1";
            res.json(json);
            return;
        }
        if (server.creator !== uid && !(config.admin_users as string[]).includes(uid)) {
            json.msg = "Bạn không sở hữu máy chủ này! ";
            res.json(json);
            return;
        }
        serverCache.del(id);
        serverStorage.delete(id, function (ok: boolean) {
            if(ok){
                json.code = 2;
                res.json(json);
            } else {
                json.msg = "Backend error! #2";
                res.json(json);
            }
        })
    });
});

app.post('/server/create', (req, res) => {
    let json = {
        code: 0,
        msg: ""
    };
    const uid = req.body.uid;
    if(!tokenCache.isValidToken(uid, req.body.utk)) {
        res.json(json);
        return;
    }
    json.code = 1;

    const id = cyrb53(crypto.randomBytes(10).toString('hex'), Date.now() / 1000);
    if(serverCache.get(id) != undefined){
        json.msg = "Backend error! #1";
        res.json(json);
        return;
    }
    const server = new Server(id, {
        name: req.body.name,
        intro: req.body.intro,
        ip: req.body.ip,
        port: parseInt(req.body.port),
        website: req.body.website,
        tags: req.body.tags,
        createdDate: (new Date).getTime(),
        creator: uid,
        diffPing: req.body.diffPing === 'true',
        pingIp: req.body.pingIp,
        pingPort: parseInt(req.body.pingPort)
    });
    serverCache.set(id, server);
    serverStorage.save(id, server, function (ok: boolean) {
        if(ok) {
            json.code = 2;
            res.json(json);
        } else {
            json.msg = "Backend error! #2";
            res.json(json);
        }
    });
});

app.post('/server/edit', (req, res) => {
    let json = {
        code: 0,
        msg: ""
    };
    const uid = req.body.uid;
    if(!tokenCache.isValidToken(uid, req.body.utk)) {
        res.json(json);
        return;
    }
    const id = req.body.sid;
    if(id == undefined) {
        res.json(json);
        return;
    }
    json.code = 1;

    serverCache.request(id, null, function (server: Server){
        if (server == undefined) {
            json.msg = "Không tìm thấy máy chủ này!";
            res.json(json);
        } else {
            if (server.creator === uid) {
                serverCache.set(id, Object.assign(server, {
                    name: req.body.name,
                    intro: req.body.intro,
                    ip: req.body.ip,
                    port: parseInt(req.body.port),
                    website: req.body.website,
                    tags: req.body.tags,
                    lastEdited: (new Date).getTime(),
                    diffPing: req.body.diffPing === 'true',
                    pingIp: req.body.pingIp,
                    pingPort: parseInt(req.body.pingPort)
                }));
                serverStorage.save(id, server, function (ok: boolean) {
                    if(ok) {
                        json.code = 2;
                        res.json(json);
                    } else {
                        json.msg = "Backend error! #1";
                        res.json(json);
                    }
                });
            } else {
                json.msg = "Máy chủ này không thuộc về bạn!";
                res.json(json);
            }
        }
    });
});
