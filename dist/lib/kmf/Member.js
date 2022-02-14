"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const Key_1 = __importDefault(require("./Key"));
const encryption = __importStar(require("../encryption"));
const path = require("path");
class Member {
    constructor(options, DB, keyRing, master) {
        this._keys = [];
        this._mode = null;
        this.uuid = options.uuid;
        this.name = options.name;
        this._keyRing = keyRing;
        this._db = DB;
        if (master) {
            this._master = master;
        }
        this.uniqueName = options.uuid + ':' + options.name;
        for (let x in options.keys) {
            this._keys.push(new Key_1.default(options.keys[x], this._db));
        }
    }
    getKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            let privateKey, publicKey;
            try {
                privateKey = yield this._master.keys[0].load('privateKey');
            }
            catch (e) {
                console.log("Unable to load master key");
                throw new Error(e.message);
            }
            try {
                publicKey = yield this._keys[0].load('publicKey');
            }
            catch (e) {
                console.log(e);
                console.log("Unable to load member key " + this._keys[0].uuid);
                throw new Error(e.message);
            }
            return {
                privateKey: privateKey,
                publicKey: publicKey
            };
        });
    }
    destroy() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                for (let x in this._keys) {
                    yield this._keys[x].destroy();
                }
                resolve(this.uuid + ' Keys Destroyed');
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    data() {
        this._mode = 'data';
        return this;
    }
    file() {
        this._mode = 'file';
        return this;
    }
    encrypt(dataOrFilePath, name) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this._mode === null) {
                throw new Error("encrypt must be used with file() or data()");
            }
            if (this._mode === 'data') {
                if (typeof name === "undefined") {
                    throw new Error("name is required for data mode");
                }
                else {
                    const keyRingData = {
                        name: name,
                        path: 'in:memory',
                        encrypted: yield encryption.encrypt(dataOrFilePath, yield this.getKeys()),
                        service: 'unsaved'
                    };
                    yield this._keyRing.addData(keyRingData);
                    resolve(keyRingData);
                }
            }
            if (this._mode === 'file') {
                const sp = dataOrFilePath.split(path.sep);
                const keyRingData = {
                    name: typeof name === 'undefined' ? sp[sp.length - 1] : name,
                    path: dataOrFilePath,
                    service: 'local'
                };
                yield encryption.encryptFile(dataOrFilePath, yield this.getKeys());
                resolve(yield this._keyRing.addData(keyRingData));
            }
        }));
    }
    decrypt(keyRingData) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this._mode === null) {
                    reject("decrypt must be used with file() or data()");
                }
                if (this._mode === 'data') {
                    if (!keyRingData.encrypted) {
                        reject("encrypted is required for data mode");
                    }
                    const result = Object.assign(Object.assign({}, keyRingData), { decrypted: yield encryption.decrypt(keyRingData.encrypted, yield this.getKeys()) });
                    resolve(result);
                }
                if (this._mode === 'file') {
                    yield encryption.decryptFile(keyRingData.path, yield this.getKeys());
                    resolve(keyRingData);
                }
            }));
        });
    }
    get keys() {
        return this._keys;
    }
    get save() {
        return this._save;
    }
    get delete() {
        return this._delete;
    }
    set save(save) {
        this._save = save;
    }
    set delete(del) {
        this._delete = del;
    }
}
exports.default = Member;
//# sourceMappingURL=Member.js.map