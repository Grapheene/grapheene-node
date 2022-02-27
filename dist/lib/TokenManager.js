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
const EventFactory_1 = __importDefault(require("./EventFactory"));
const Rest_1 = __importDefault(require("./rest/Rest"));
const config = require('../../config.json');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const e = (0, EventFactory_1.default)();
class TokenManager {
    constructor(clientId, options) {
        this.ready = false;
        this._clientId = clientId;
        this._proof = options.proof;
        this._onUpdate = options.onUpdate;
        this._authDir = options.authDir;
        fs.ensureDirSync(this._authDir);
        this._restClient = new Rest_1.default(config.baseUrl);
        this.loadToken(this._clientId, this._proof);
        e.on('refreshToken', () => {
            this.auth(this._clientId, this._proof);
        });
    }
    getAuth(proof) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getToken(this._clientId, proof);
        });
    }
    loadToken(clientId, proof) {
        if (fs.existsSync(this._authDir + '/token') && fs.existsSync(this._authDir + '/rsa')) {
            const token = fs.readFileSync(this._authDir + '/token', 'utf8');
            const rsa = fs.readFileSync(this._authDir + '/rsa', 'utf8');
            jwt.verify(token, rsa, { algorithms: ['RS256'] }, (err, decoded) => {
                if (err) {
                    if (err.message === 'jwt expired') {
                        console.log('Refreshing JWT...');
                        e.emit('refreshToken');
                    }
                    else {
                        console.error('Unable to verify token:', err.message);
                    }
                }
                else {
                    const unixtime = Math.floor(+new Date() / 1000);
                    if (decoded.exp - unixtime <= 300) {
                        e.emit('refreshToken');
                    }
                    else {
                        this._token = token;
                        this._rsa = rsa;
                        this._onUpdate({ Token: this._token, Key: this._rsa });
                        this.ready = true;
                    }
                }
            });
        }
        else {
            this.getToken(clientId, proof).then(() => {
                this.ready = true;
            });
        }
    }
    getToken(clientId, proof) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this._restClient.post('/auth', { uuid: clientId, proof: proof });
            this._token = result.data.token;
            this._rsa = result.data.publicKey;
            fs.writeFileSync(this._authDir + '/token', this._token);
            fs.writeFileSync(this._authDir + '/rsa', this._rsa);
            this._onUpdate({ Token: this._token, Key: this._rsa });
            this.watch();
            return result;
        });
    }
    auth(clientId, proof) {
        if (!proof || !clientId) {
            throw new Error('Token manager is not set');
        }
        clearInterval(this.interval);
        this.getToken(clientId, proof);
    }
    watch() {
        this.interval = setInterval(() => {
            if (this._token && this._rsa) {
                jwt.verify(this._token, this._rsa, { algorithms: ['RS256'] }, function (err, decoded) {
                    if (err) {
                        if (err.message === 'jwt expired') {
                            console.log('Refreshing JWT...');
                            e.emit('refreshToken');
                        }
                        else {
                            console.error('Unable to verify token:', err.message);
                        }
                    }
                    else {
                        const unixtime = Math.floor(+new Date() / 1000);
                        if (decoded.exp - unixtime <= 300) {
                            e.emit('refreshToken');
                        }
                    }
                });
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