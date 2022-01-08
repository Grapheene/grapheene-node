"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grapheene = void 0;
const AuthorizedRest_1 = require("./rest/AuthorizedRest");
const Zokrates_1 = require("./zk/Zokrates");
const KMS_1 = require("./kms/KMS");
const Crypto = require("./encryption");
const config = require('../../config.json');
const fs = require('fs-extra');
const path = require('path');
const defaults = {};
class Grapheene {
    constructor(clientId, apiKey, opts) {
        this._options = Object.assign({}, defaults, opts);
        this.apiKey = apiKey;
        this.clientId = clientId;
        this.crypto = Crypto;
        this.filesDir = path.dirname(require.main.filename || process.mainModule.filename) + '/files';
        if (!this.apiKey.startsWith('SK') || !this.apiKey) {
            throw new Error('Invalid APK Key');
        }
        if (!this.clientId.startsWith('US') || !this.clientId) {
            throw new Error('Invalid Client ID');
        }
        this.zkDir = this.filesDir + '/zk';
        this.cryptoDir = this.filesDir + '/encrypt';
        this.ensureDirExist();
        this.setupZK();
        this.setupTokenManager();
        this._restClient = new AuthorizedRest_1.default(config.baseUrl, this.clientId, this.zk);
        this.setupKMS();
    }
    ensureDirExist() {
        fs.ensureDirSync(this.filesDir);
        fs.ensureDirSync(this.zkDir);
        fs.ensureDirSync(this.cryptoDir);
    }
    setupZK() {
        this.zk = new Zokrates_1.Zokrates(this.clientId, this.apiKey, { path: this.zkDir });
    }
    setupTokenManager() {
    }
    setupKMS() {
        this.kms = new KMS_1.KMS(this._restClient);
    }
    set zk(zk) {
        this._zk = zk;
    }
    save(filePath, data) {
        this.createDir(filePath);
        fs.writeFileSync(filePath, data);
    }
    createDir(filePath) {
        const seperator = path.sep;
        let regEx = new RegExp(`(^${seperator}.+)(${seperator}.+$)`);
        const match = filePath.match(regEx);
        fs.ensureDirSync(match[1]);
    }
    get zk() {
        return this._zk;
    }
    set kms(kms) {
        this._kms = kms;
    }
    get kms() {
        return this._kms;
    }
    set crypto(crypto) {
        this._crypto = crypto;
    }
    get crypto() {
        return this._crypto;
    }
    set storage(storage) {
        this._storage = storage;
    }
    get storage() {
        return this._storage;
    }
}
exports.Grapheene = Grapheene;
//# sourceMappingURL=Grapheene.js.map