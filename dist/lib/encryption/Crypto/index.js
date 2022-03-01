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
exports.getPublicJwk = exports.pemToJwk = exports.jwkToPem = exports.importJwk = exports.exportJwk = exports.hmacSign = exports.generateEncryptedKey = exports.decryptFileStream = exports.encryptFileStream = exports.encryptFile = exports.decryptFile = exports.encryptHex = exports.encrypt = exports.decrypt = exports.generateRandomString = exports.hexToBytes = exports.bytesToHex = exports.ab2str = exports.str2ab = exports.HMAC = exports.ECDHKeyPair = exports.AESKey = void 0;
const crypto = __importStar(require("crypto"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
let webcrypto, CryptoKeyInstance;
if (typeof window === "undefined") {
    webcrypto = require('crypto').webcrypto;
    // @ts-ignore
    CryptoKeyInstance = typeof crypto.webcrypto !== "undefined" ? crypto.webcrypto.CryptoKey : crypto.CryptoKey;
}
else {
    webcrypto = window.crypto;
    CryptoKeyInstance = CryptoKey;
}
class AESKey {
    constructor(options) {
        if (options.key instanceof CryptoKeyInstance) {
            this._key = options.key;
        }
        else {
            this._password = options.password;
            if (!options.password) {
                this._password = generateRandomString();
            }
        }
    }
    encrypted(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const salt = webcrypto.getRandomValues(new Uint8Array(16));
            const secretKey = yield this.importSecretKey(password);
            const derivedKey = yield this.deriveEncryptionSecretKey(salt, secretKey);
            let encryptedKey = yield this._encrypt(this._password, salt, derivedKey);
            return { encryptedKey, key: this._password };
        });
    }
    importSecretKey(password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._key)
                return this._key;
            if (!password) {
                password = this._password;
            }
            let rawPassword = str2ab(password);
            return webcrypto.subtle.importKey("raw", rawPassword, {
                name: 'PBKDF2'
            }, false, ['deriveKey']);
        });
    }
    deriveEncryptionSecretKey(salt, secretKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._key)
                return this._key;
            if (!secretKey) {
                secretKey = yield this.importSecretKey();
            }
            return webcrypto.subtle.deriveKey({
                name: 'PBKDF2',
                salt: salt,
                iterations: 80000,
                hash: {
                    name: 'SHA-256'
                },
            }, secretKey, {
                name: 'AES-GCM',
                length: 256,
            }, true, ['encrypt', 'decrypt']);
        });
    }
    deriveDecryptionSecretKey(salt, secretKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._key)
                return this._key;
            if (!secretKey) {
                secretKey = yield this.importSecretKey();
            }
            return webcrypto.subtle.deriveKey({
                name: 'PBKDF2',
                salt: salt,
                iterations: 80000,
                hash: {
                    name: 'SHA-256'
                },
            }, secretKey, {
                name: 'AES-GCM',
                length: 256,
            }, true, ['encrypt', 'decrypt']);
        });
    }
    encrypt(bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            const salt = webcrypto.getRandomValues(new Uint8Array(16));
            const derivedKey = yield this.deriveEncryptionSecretKey(salt);
            return this._encrypt(bytes, salt, derivedKey);
        });
    }
    _encrypt(bytes, salt, derivedKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof bytes === 'string') {
                bytes = str2ab(bytes);
            }
            const iv = webcrypto.getRandomValues(new Uint8Array(16));
            const content = new Uint8Array(bytes);
            return webcrypto.subtle.encrypt({
                iv,
                name: 'AES-GCM'
            }, derivedKey, content)
                .then((encrypted) => {
                let encryptedContent = new Uint8Array(encrypted);
                let len = iv.length + salt.length + encryptedContent.length;
                let x = new Uint8Array(len);
                x.set(iv);
                x.set(salt, iv.length);
                x.set(encryptedContent, salt.length + iv.length);
                return x;
            })
                .catch((err) => {
                console.error('Unable to encrypt:', err);
                return {};
            });
        });
    }
    decrypt(bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof bytes === 'string') {
                bytes = str2ab(bytes);
            }
            bytes = new Uint8Array(bytes);
            const salt = new Uint8Array(bytes.slice(16, 32));
            const iv = new Uint8Array(bytes.slice(0, 16));
            const content = new Uint8Array(bytes.slice(32));
            const derivedKey = yield this.deriveDecryptionSecretKey(salt);
            return webcrypto.subtle.decrypt({
                iv,
                name: 'AES-GCM'
            }, derivedKey, content)
                .then((decrypted) => {
                return new Uint8Array(decrypted);
                /*return {
                  bytes: dec,
                  utf8: ()=>ab2str(dec),
                  hex: ()=>bytesToHex(dec)
                }*/
            }).catch((err) => {
                console.error("Unable to decrypt:", err);
                return null;
            });
        });
    }
    encryptFileStream(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const sp = filePath.split(path_1.default.sep);
                const fileName = sp[sp.length - 1];
                const outPath = filePath.replace(fileName, `enc_${fileName}`);
                const fd = yield fs_1.promises.open(filePath, 'r');
                const rs = fd.createReadStream();
                const od = yield fs_1.promises.open(outPath, 'w');
                const of = od.createWriteStream();
                rs.on('open', () => {
                    console.log('File successfully opened');
                });
                rs.on('data', (chunk) => __awaiter(this, void 0, void 0, function* () {
                    const encrypted = yield this.encrypt(chunk);
                    if (encrypted) {
                        of.write(encrypted);
                    }
                }));
                rs.on('close', () => {
                    console.log('File successfully closed');
                });
                rs.on('end', function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield fs_1.promises.unlink(filePath);
                        yield fs_1.promises.rename(outPath, filePath);
                        this.destroy();
                        return resolve(true);
                    });
                });
                rs.on('error', (err) => {
                    reject(err.message);
                });
            }));
        });
    }
    decryptFileStream(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const sp = filePath.split(path_1.default.sep);
                const fileName = sp[sp.length - 1];
                const outPath = filePath.replace(fileName, `denc_${fileName}`);
                const fd = yield fs_1.promises.open(filePath, 'r');
                const rs = fd.createReadStream();
                const od = yield fs_1.promises.open(outPath, 'w');
                const of = od.createWriteStream();
                rs.on('open', () => {
                    console.log('File successfully opened');
                });
                rs.on('data', (chunk) => __awaiter(this, void 0, void 0, function* () {
                    const decrypted = yield this.decrypt(chunk);
                    if (decrypted) {
                        of.write(decrypted);
                    }
                }));
                rs.on('close', () => {
                    console.log('File successfully closed');
                });
                rs.on('end', function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield fs_1.promises.unlink(filePath);
                        yield fs_1.promises.rename(outPath, filePath);
                        this.destroy();
                        return resolve(true);
                    });
                });
                rs.on('error', (err) => {
                    reject(err.message);
                });
            }));
        });
    }
    encryptFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const fileData = yield fs_1.promises.readFile(file, 'utf8');
                    const fileBuffer = Buffer.from(fileData, 'utf8');
                    const fileArrayBuffer = new ArrayBuffer(fileData.length);
                    const fileArray = new Uint8Array(fileArrayBuffer);
                    for (let i = 0; i < fileData.length; ++i) {
                        fileArray[i] = fileBuffer[i];
                    }
                    const salt = webcrypto.getRandomValues(new Uint8Array(16));
                    const derivedKey = yield this.deriveEncryptionSecretKey(salt);
                    const iv = webcrypto.getRandomValues(new Uint8Array(16));
                    const content = new Uint8Array(fileArrayBuffer);
                    webcrypto.subtle.encrypt({
                        iv,
                        name: 'AES-GCM'
                    }, derivedKey, content)
                        .then((encrypted) => {
                        const encryptedContent = new Uint8Array(encrypted);
                        const blob = new Blob([iv, salt, encryptedContent], { type: 'application/octet-stream' });
                        const encFile = new File([blob], 'encryptedFile', {
                            lastModified: file.lastModified,
                            type: file.type
                        });
                        return resolve([encFile, content]);
                    })
                        .catch((err) => {
                        console.error('Unable to encrypt:', err);
                        return resolve(null);
                    });
                }
                catch (err) {
                    console.error('Unable to encrypt:', err);
                }
            }));
        });
    }
    decryptFile(file, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const fileData = yield fs_1.promises.readFile(file, 'utf8');
                    const fileBuffer = Buffer.from(fileData, 'utf8');
                    const fileArrayBuffer = new ArrayBuffer(fileData.length);
                    const fileArray = new Uint8Array(fileArrayBuffer);
                    for (let i = 0; i < fileData.length; ++i) {
                        fileArray[i] = fileBuffer[i];
                    }
                    const salt = new Uint8Array(fileArrayBuffer.slice(16, 32));
                    const derivedKey = yield this.deriveDecryptionSecretKey(salt);
                    const iv = new Uint8Array(fileArrayBuffer.slice(0, 16));
                    const content = new Uint8Array(fileArrayBuffer.slice(32));
                    webcrypto.subtle.decrypt({
                        iv,
                        name: 'AES-GCM'
                    }, derivedKey, content)
                        .then((decrypted) => {
                        const opts = {};
                        if (type) {
                            opts.type = type;
                        }
                        const blob = new Blob([new Uint8Array(decrypted)], opts);
                        return resolve(blob);
                    })
                        .catch((err) => {
                        console.error("Unable to decrypt:", err);
                        return resolve(null);
                    });
                }
                catch (err) {
                    console.error('Unable to decrypt:', err);
                }
            }));
        });
    }
    export() {
        return __awaiter(this, void 0, void 0, function* () {
            let secretKey = yield this.importSecretKey();
            let exported = new ExportedKey(secretKey);
            yield exported.bytes();
            return exported;
        });
    }
}
exports.AESKey = AESKey;
class ExportedKey {
    constructor(key, type) {
        this.key = key;
        this.type = type || 'raw';
    }
    bytes() {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('EXP:BYTES1', this.type, this.key)
            let exported = yield webcrypto.subtle.exportKey(this.type, this.key);
            //console.log('EXP:BYTES2')
            this._bytes = new Uint8Array(exported);
            //console.log('EXP:BYTES3')
            return this._bytes;
        });
    }
    base64() {
        return Buffer.from(this.toString(), 'binary').toString('base64');
    }
    pem() {
        let str = this.base64().replace(/(.{64})/gm, '$1\n');
        return `-----BEGIN PRIVATE KEY-----\n${str}\n-----END PRIVATE KEY-----`;
    }
    toString() {
        return ab2str(this._bytes);
    }
    toHex() {
        return bytesToHex(this._bytes);
    }
    encrypt(password) {
        return __awaiter(this, void 0, void 0, function* () {
            let encryptionKey = new AESKey({ password });
            let encrypted = yield encryptionKey.encrypt(this._bytes);
            return ab2str(encrypted);
        });
    }
}
class ECDHKeyPair {
    constructor(raw) {
        this._pair = {};
        this._raw = raw;
    }
    static generate() {
        return __awaiter(this, void 0, void 0, function* () {
            let key = new ECDHKeyPair();
            key._pair = yield webcrypto.subtle.generateKey({
                name: "ECDH",
                namedCurve: 'P-384'
            }, true, ["deriveKey", "deriveBits"]);
            return key;
        });
    }
    get privateKey() {
        return this._pair.privateKey;
    }
    get publicKey() {
        return this._pair.publicKey;
    }
    deriveKey(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return webcrypto.subtle.deriveKey({
                name: 'ECDH',
                public: publicKey
            }, this.privateKey, {
                name: 'AES-GCM',
                length: 256
            }, true, ['encrypt', 'decrypt']);
        });
    }
    exportPrivateKey() {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('EPK1')
            let exported = new ExportedKey(this.privateKey, 'pkcs8');
            //console.log('EPK2')
            yield exported.bytes();
            //console.log('EPK3')
            return exported;
        });
    }
    exportPublicKey() {
        return __awaiter(this, void 0, void 0, function* () {
            let exported = new ExportedKey(this.publicKey);
            yield exported.bytes();
            return exported;
        });
    }
    exportDerivedAESKey(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            let aes = yield this.deriveKey(publicKey);
            let exported = new ExportedKey(aes);
            yield exported.bytes();
            return exported;
        });
    }
    importPrivateKey(raw) {
        return __awaiter(this, void 0, void 0, function* () {
            if (raw instanceof CryptoKeyInstance) {
                this._pair.privateKey = raw;
                return raw;
            }
            raw = str2ab(raw);
            let key = yield webcrypto.subtle.importKey('pkcs8', raw, {
                name: "ECDH",
                namedCurve: 'P-384'
            }, true, ['deriveKey', 'deriveBits']);
            if (!this._pair)
                this._pair = {};
            this._pair.privateKey = key;
            return key;
        });
    }
    importPublicKey(raw) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('IMPORT PUBLIC KEY')
            if (raw instanceof CryptoKeyInstance) {
                //console.log('IMPORT PUBLIC KEY AS CRYPTO KEY')
                this._pair.publicKey = raw;
                return raw;
            }
            //console.log('IMPORT PUBLIC KEY AS RAW')
            raw = str2ab(raw);
            let key = yield webcrypto.subtle.importKey('raw', raw, {
                name: "ECDH",
                namedCurve: 'P-384'
            }, true, []);
            if (!this._pair)
                this._pair = {};
            this._pair.publicKey = key;
            return key;
        });
    }
}
exports.ECDHKeyPair = ECDHKeyPair;
class HMAC {
    constructor(raw, useSalt) {
        this.useSalt = useSalt;
        if (raw instanceof CryptoKeyInstance) {
            this._key = raw;
        }
        else if (raw) {
            this._raw = str2ab(raw);
        }
    }
    importKey() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._key) {
                return this._key;
            }
            let key = yield webcrypto.subtle.importKey('raw', this._raw, {
                name: 'HMAC',
                hash: 'SHA-256',
            }, true, ['sign', 'verify']);
            this._key = key;
            return key;
        });
    }
    key() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._key)
                return this._key;
            if (this._raw) {
                return this.importKey();
            }
            this._key = yield webcrypto.subtle.generateKey({
                name: 'HMAC',
                hash: 'SHA-256'
            }, true, ['sign', 'verify']);
            return this._key;
        });
    }
    verify(message, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            let salt;
            if (typeof signature === 'string') {
                if (!signature.match(/[^A-Fa-f0-9]+/)) {
                    if (this.useSalt) {
                        salt = hexToBytes(signature.slice(0, 32));
                        signature = hexToBytes(signature.slice(32));
                    }
                    else {
                        signature = hexToBytes(signature);
                    }
                }
                else
                    throw new Error('Malformed signature');
            }
            let encoded;
            if (this.useSalt) {
                encoded = str2ab(message + ab2str(salt));
            }
            else {
                encoded = str2ab(message);
            }
            return yield webcrypto.subtle.verify("HMAC", yield this.key(), signature, encoded);
        });
    }
    sign(message) {
        return __awaiter(this, void 0, void 0, function* () {
            let salt, encoded;
            if (this.useSalt) {
                salt = webcrypto.getRandomValues(new Uint8Array(16));
                encoded = str2ab(message + ab2str(salt));
            }
            else {
                encoded = str2ab(message);
            }
            let signature = yield webcrypto.subtle.sign("HMAC", yield this.key(), encoded);
            return bytesToHex(salt) + bytesToHex(signature);
        });
    }
    export() {
        return __awaiter(this, void 0, void 0, function* () {
            let secretKey = yield this.key();
            let exported = new ExportedKey(secretKey);
            yield exported.bytes();
            return exported;
        });
    }
}
exports.HMAC = HMAC;
function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
exports.str2ab = str2ab;
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}
exports.ab2str = ab2str;
function bytesToHex(bytes) {
    bytes = new Uint8Array(bytes);
    let hex = '';
    bytes.forEach((byte) => hex += (byte.toString(16) + '').padStart(2, '0'));
    return hex;
}
exports.bytesToHex = bytesToHex;
function hexToBytes(hex) {
    let match = hex.match(/.{2}/g);
    if (!match)
        return null;
    let m = match.map((hex) => parseInt(hex, 16));
    return new Uint8Array(m);
}
exports.hexToBytes = hexToBytes;
function generateRandomString() {
    const usedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#_+=!$%&¡-';
    let keyArray = new Uint8Array(16);
    keyArray = keyArray.map(x => usedChars.charCodeAt(x % usedChars.length));
    return String.fromCharCode.apply(null, keyArray);
}
exports.generateRandomString = generateRandomString;
function decrypt(data, password) {
    return __awaiter(this, void 0, void 0, function* () {
        let props = { password };
        if (password instanceof CryptoKeyInstance) {
            props.key = password;
        }
        let decryptionKey = new AESKey(props);
        let key = yield decryptionKey.decrypt(data);
        if (!key) {
            return null;
        }
        return ab2str(key);
    });
}
exports.decrypt = decrypt;
function encrypt(data, password) {
    return __awaiter(this, void 0, void 0, function* () {
        let props = { password };
        if (password instanceof CryptoKeyInstance) {
            props = { key: password };
        }
        let encryptionKey = new AESKey(props);
        let key = yield encryptionKey.encrypt(data);
        if (!key) {
            return null;
        }
        return ab2str(key);
    });
}
exports.encrypt = encrypt;
function encryptHex(data, password) {
    return __awaiter(this, void 0, void 0, function* () {
        let encryptionKey = new AESKey({ password });
        let key = yield encryptionKey.encrypt(data);
        if (!key) {
            return null;
        }
        importJwk;
        return bytesToHex(key);
    });
}
exports.encryptHex = encryptHex;
function decryptFile(file, password, type) {
    return __awaiter(this, void 0, void 0, function* () {
        let decryptionKey = new AESKey({ password });
        let key = yield decryptionKey.decryptFile(file, type);
        if (!key) {
            return null;
        }
        return key;
    });
}
exports.decryptFile = decryptFile;
function encryptFile(file, password) {
    return __awaiter(this, void 0, void 0, function* () {
        let encryptionKey = new AESKey({ password });
        let keyArray = yield encryptionKey.encryptFile(file);
        if (!keyArray[0]) {
            return null;
        }
        return [keyArray[0], keyArray[1]];
    });
}
exports.encryptFile = encryptFile;
function encryptFileStream(file, password) {
    return __awaiter(this, void 0, void 0, function* () {
        let props = { password };
        if (password instanceof CryptoKeyInstance) {
            props = { key: password };
        }
        let encryptionKey = new AESKey(props);
        let keyArray = yield encryptionKey.encryptFileStream(file);
        if (!keyArray) {
            return null;
        }
        return file;
    });
}
exports.encryptFileStream = encryptFileStream;
function decryptFileStream(file, password) {
    return __awaiter(this, void 0, void 0, function* () {
        let props = { password };
        if (password instanceof CryptoKeyInstance) {
            props = { key: password };
        }
        let encryptionKey = new AESKey(props);
        let keyArray = yield encryptionKey.decryptFileStream(file);
        if (!keyArray) {
            return null;
        }
        return file;
    });
}
exports.decryptFileStream = decryptFileStream;
function generateEncryptedKey(password) {
    return __awaiter(this, void 0, void 0, function* () {
        let key = generateRandomString();
        let encryptedKey = yield encrypt(key, password);
        return { encryptedKey, key };
    });
}
exports.generateEncryptedKey = generateEncryptedKey;
function hmacSign(msg, key) {
    return __awaiter(this, void 0, void 0, function* () {
        let h = new HMAC(key);
        return h.sign(msg);
    });
}
exports.hmacSign = hmacSign;
function exportJwk(key) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield webcrypto.subtle.exportKey('jwk', key);
    });
}
exports.exportJwk = exportJwk;
function importJwk(jwk) {
    return __awaiter(this, void 0, void 0, function* () {
        let type = (jwk.kty || '').toLowerCase();
        if (!type) {
            return null;
        }
        let algo;
        if (type == 'ec') {
            algo = {
                name: 'ECDH',
                namedCurve: jwk.crv
            };
        }
        else if (type == 'oct') {
            if (jwk.alg == 'HS256') {
                algo = {
                    name: 'HMAC',
                    hash: 'SHA-256'
                };
            }
        }
        if (!algo) {
            return null;
        }
        //console.log('imported', imported, imported instanceof CryptoKeyInstance)
        return yield webcrypto.subtle.importKey('jwk', jwk, algo, true, jwk.key_ops);
    });
}
exports.importJwk = importJwk;
function jwkToPem(jwk, opts = {}) {
    const str = Buffer.from(JSON.stringify(jwk), 'binary').toString('base64').replace(/(.{64})/gm, '$1\n').replace(/\s$/, '');
    const type = opts.private ? 'PRIVATE ' : (opts.hmac ? '' : 'PUBLIC ');
    return `-----BEGIN ${type}KEY-----
${str}
-----END ${type}KEY-----`;
}
exports.jwkToPem = jwkToPem;
function pemToJwk(pem) {
    const jwkStr = Buffer.from(pem.replace(/-----(BEGIN|END)(.*)-----/g, '').replace(/\s/g, ''), 'base64').toString('binary');
    // console.log('JWKSTR', jwkStr)
    let jwk;
    try {
        jwk = JSON.parse(jwkStr);
        //console.log('jwk', jwk)
    }
    catch (e) {
        //console.log('e', e)
        return null;
    }
    return jwk;
}
exports.pemToJwk = pemToJwk;
function getPublicJwk(jwk) {
    delete jwk.d;
    jwk.key_ops = [];
    return jwk;
}
exports.getPublicJwk = getPublicJwk;
//# sourceMappingURL=index.js.map