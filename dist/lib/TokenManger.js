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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenManager = void 0;
const EventFactory_1 = require("./EventFactory");
const Rest_1 = require("./rest/Rest");
const config = require('../../config.json');
const jwt = require('jsonwebtoken');
const e = (0, EventFactory_1.default)();
class TokenManager {
    constructor(clientId, options) {
        this._clientId = clientId;
        this._proof = options.proof;
        this._onUpdate = options.onUpdate;
        this._restClient = new Rest_1.default(config.baseUrl);
        this.getToken(this._clientId, this._proof);
        e.on('refreshToken', () => {
            this.auth(this._clientId, this._proof);
        });
    }
    getAuth(proof) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._restClient.post('/auth', { uuid: this._clientId, proof: proof });
        });
    }
    getToken(clientId, proof) {
        this._restClient.post('/auth', { uuid: clientId, proof: proof })
            .then((result) => {
            this._token = result.data.token;
            this._rsa = result.data.publicKey;
            this._onUpdate({ Token: this._token, Key: this._rsa });
            this.watch();
        }).catch((e) => {
            console.log(e.message);
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
                        console.log(err);
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
//# sourceMappingURL=TokenManger.js.map