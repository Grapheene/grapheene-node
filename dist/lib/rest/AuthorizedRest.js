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
const TokenManager_1 = require("../TokenManager");
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
class AuthorizedRest extends Rest_1.default {
    constructor(base_url, clientId, zk, authDir) {
        super(base_url);
        this.zk = zk;
        this._clientId = clientId;
        this._authDir = authDir;
    }
    init() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                this.tokenManager = new TokenManager_1.TokenManager(this._clientId, {
                    proof: JSON.stringify(this.zk.generateProof()),
                    authDir: this._authDir,
                    onUpdate: this.updateRestHeaders
                });
                console.log('Token Manager created!');
                yield this.tokenManager.init();
                this.updateRestHeaders({
                    Token: this.tokenManager.jwt,
                    Key: JSON.stringify(this.tokenManager.publicKey)
                });
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
            if (!this._headers.hasOwnProperty('Token') || !this._headers.hasOwnProperty('Key')) {
                try {
                    const result = yield this.tokenManager.getAuth(JSON.stringify(this.zk.generateProof()));
                    this.updateRestHeaders({ Token: result.data.token, Key: JSON.stringify(result.data.publicKey) });
                }
                catch (e) {
                    throw new Error(e.message);
                }
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
}
exports.default = AuthorizedRest;
//# sourceMappingURL=AuthorizedRest.js.map