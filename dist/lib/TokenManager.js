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
exports.TokenManager = void 0;
const Rest_1 = __importDefault(require("./rest/Rest"));
const fs_1 = require("fs");
const config = require('../../config.json');
const jwt = require('jsonwebtoken');
class TokenManager {
    constructor(clientId, options) {
        this.ready = false;
        this._clientId = clientId;
        this._proof = options.proof;
        this._onUpdate = options.onUpdate;
        this._authDir = options.authDir;
    }
    init() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs_1.promises.mkdir(this._authDir, { recursive: true });
                this._restClient = new Rest_1.default(config.baseUrl);
                console.log('created token manager rest');
                yield this.getToken(this._clientId, this._proof);
                yield this.loadToken(this._clientId, this._proof);
                return resolve(true);
            }
            catch (err) {
                console.error('Unable to create TokenManager authDir:', err);
                return reject(err);
            }
        }));
    }
    getAuth(proof) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getToken(this._clientId, proof);
        });
    }
    loadToken(clientId, proof) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const tokenFile = `${this._authDir}/token`;
                const rsaFile = `${this._authDir}/rsa`;
                const token = yield fs_1.promises.readFile(tokenFile, 'utf8');
                const rsa = yield fs_1.promises.readFile(rsaFile, 'utf8');
                jwt.verify(token, rsa, { algorithms: ['RS256'] }, (err, decoded) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        if (err.message === 'jwt expired') {
                            console.log('Refreshing JWT...');
                            yield this.auth(this._clientId, this._proof);
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
                            console.log('Refreshing JWT...');
                            yield this.auth(this._clientId, this._proof);
                            return resolve(true);
                        }
                        else {
                            this._token = token;
                            this._rsa = rsa;
                            this._onUpdate({ Token: this._token, Key: this._rsa });
                            this.ready = true;
                            return resolve(true);
                        }
                    }
                }));
            }
            catch (e) {
                // ignore error
                console.log(e);
                yield this.getToken(clientId, proof);
                this.ready = true;
            }
        }));
    }
    getToken(clientId, proof) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this._restClient.post('/auth', { uuid: clientId, proof: proof });
                this._token = result.data.token;
                this._rsa = result.data.publicKey;
                yield fs_1.promises.writeFile(`${this._authDir}/token`, this._token);
                yield fs_1.promises.writeFile(`${this._authDir}/rsa`, this._rsa);
                this._onUpdate({ Token: this._token, Key: this._rsa });
                this.watch();
                return result;
            }
            catch (err) {
                console.error('Unable to get token:', err);
            }
        });
    }
    auth(clientId, proof) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!proof || !clientId) {
                throw new Error('Token manager is not set');
            }
            clearInterval(this.interval);
            yield this.getToken(clientId, proof);
        });
    }
    watch() {
        this.interval = setInterval(() => {
            if (this._token && this._rsa) {
                jwt.verify(this._token, this._rsa, { algorithms: ['RS256'] }, (err, decoded) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        if (err.message === 'jwt expired') {
                            console.log('Refreshing JWT...');
                            yield this.auth(this._clientId, this._proof);
                        }
                        else {
                            console.error('Unable to verify token:', err.message);
                        }
                    }
                    else {
                        const unixtime = Math.floor(+new Date() / 1000);
                        if (decoded.exp - unixtime <= 300) {
                            console.log('Refreshing JWT...');
                            yield this.auth(this._clientId, this._proof);
                        }
                    }
                }));
            }
        }, 60000);
    }
    set proof(proof) {
        this._proof = proof;
    }
    get publicKey() {
        return this._rsa;
    }
    get jwt() {
        return this._token;
    }
}
exports.TokenManager = TokenManager;
//# sourceMappingURL=TokenManager.js.map