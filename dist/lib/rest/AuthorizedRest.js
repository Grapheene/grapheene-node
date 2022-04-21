"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Rest_1 = __importDefault(require("./Rest"));
const fs_1 = require("fs");
const axios_1 = __importDefault(require("axios"));
const jwt = require('jsonwebtoken');
class AuthorizedRest extends Rest_1.default {
    constructor(base_url, clientId, zk, authDir) {
        super(base_url);
        this.refreshJWT = () => {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const result = yield this.auth('/auth', 'POST', { uuid: this._clientId, proof: JSON.stringify(this.zk.generateProof()) });
                    this._token = result.data.token;
                    this._rsa = result.data.publicKey;
                    yield fs_1.promises.writeFile(`${this._authDir}/token`, this._token);
                    yield fs_1.promises.writeFile(`${this._authDir}/rsa`, this._rsa);
                    this.updateRestHeaders({ Token: this._token, Key: JSON.stringify(this._rsa) });
                    return resolve({ Token: this._token, Key: this._rsa });
                }
                catch (err) {
                    console.error('Unable to refresh JWT:', err);
                    return reject(err);
                }
            }));
        };
        this._base_url = base_url;
        this.zk = zk;
        this._clientId = clientId;
        this._authDir = authDir;
    }
    init() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const tokenFile = `${this._authDir}/token`;
                const rsaFile = `${this._authDir}/rsa`;
                this._token = yield fs_1.promises.readFile(tokenFile, 'utf8');
                this._rsa = yield fs_1.promises.readFile(rsaFile, 'utf8');
                this.updateRestHeaders({ Token: this._token, Key: JSON.stringify(this._rsa) });
                const valid = yield this.isJWTValid();
                if (valid === 'warn' || !valid) {
                    yield this.refreshJWT();
                    resolve(true);
                }
                resolve(true);
            }
            catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }
    updateRestHeaders(headers) {
        super.setHeaders(headers);
    }
    ensureHeaders() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._headers.hasOwnProperty('Token') || this._headers.hasOwnProperty('Key')) {
                const valid = yield this.isJWTValid();
                if (valid === 'warn') {
                    this.refreshJWT();
                }
                if (!valid) {
                    yield this.refreshJWT();
                }
            }
            else {
                yield this.refreshJWT();
            }
        });
    }
    post(endpoint, params) {
        const _super = Object.create(null, {
            post: { get: () => super.post }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureHeaders();
            return _super.post.call(this, endpoint, params);
        });
    }
    get(endpoint, params) {
        const _super = Object.create(null, {
            get: { get: () => super.get }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureHeaders();
            return _super.get.call(this, endpoint, params);
        });
    }
    put(endpoint, params) {
        const _super = Object.create(null, {
            put: { get: () => super.put }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureHeaders();
            return _super.put.call(this, endpoint, params);
        });
    }
    del(endpoint) {
        const _super = Object.create(null, {
            del: { get: () => super.del }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureHeaders();
            return _super.del.call(this, endpoint);
        });
    }
    isJWTValid() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const tokenFile = `${this._authDir}/token`;
            const rsaFile = `${this._authDir}/rsa`;
            const token = yield fs_1.promises.readFile(tokenFile, 'utf8');
            const rsa = yield fs_1.promises.readFile(rsaFile, 'utf8');
            jwt.verify(token, rsa, { algorithms: ['RS256'] }, (err, decoded) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    if (err.message === 'jwt expired') {
                        console.log('Refreshing JWT...');
                        yield this.refreshJWT();
                        return resolve(true);
                    }
                    else {
                        console.error('Unable to verify token:', err.message);
                        return reject(err.message);
                    }
                }
                else {
                    const unixtime = Math.floor(+new Date() / 1000);
                    if (decoded.exp - unixtime <= 300) {
                        console.warn('JWT will expire soon, we will refresh soon.');
                        return resolve('warn');
                    }
                    else {
                        return resolve(true);
                    }
                }
            }));
        }));
    }
    auth(endpoint, method, params) {
        console.log('Getting new JWT');
        const instance = axios_1.default.create({
            baseURL: this._base_url,
            timeout: 60000
        });
        const config = {
            url: endpoint,
            headers: this._headers || null,
            method: method.toLowerCase(),
            data: params
        };
        config.headers["Content-Type"] = 'application/json';
        return instance.request(config);
    }
}
exports.default = AuthorizedRest;
//# sourceMappingURL=AuthorizedRest.js.map