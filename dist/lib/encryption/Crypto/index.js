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
exports.sharedKey = exports.getPublicJwk = exports.pemToJwk = exports.jwkToPem = exports.importJwk = exports.exportJwk = exports.hmacSign = exports.generateEncryptedKey = exports.encryptFile = exports.decryptFile = exports.encryptHex = exports.encrypt = exports.decrypt = exports.generateRandomString = exports.hexToBytes = exports.bytesToHex = exports.ab2str = exports.str2ab = exports.HMAC = exports.ECDHKeyPair = exports.AESKey = exports.KeyStore = exports.KeyManagement = void 0;
const crypto = require("crypto");
const webcrypto = require('crypto').webcrypto;
const { subtle } = require('crypto').webcrypto;
var KeyManagement_1 = require("./KeyManagement");
Object.defineProperty(exports, "KeyManagement", { enumerable: true, get: function () { return KeyManagement_1.default; } });
var KeyStore_1 = require("./KeyStore");
Object.defineProperty(exports, "KeyStore", { enumerable: true, get: function () { return KeyStore_1.default; } });
class AESKey {
    constructor(options) {
        if (options.key instanceof crypto.webcrypto.CryptoKey) {
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
            return subtle.importKey("raw", rawPassword, {
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
            return subtle.deriveKey({
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
            return subtle.deriveKey({
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
            return subtle.encrypt({
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
                console.error("An error occured while Encrypting the file, try again!", err);
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
            return subtle.decrypt({
                iv,
                name: 'AES-GCM'
            }, derivedKey, content)
                .then((decrypted) => {
                let dec = new Uint8Array(decrypted);
                return dec;
                /*return {
                  bytes: dec,
                  utf8: ()=>ab2str(dec),
                  hex: ()=>bytesToHex(dec)
                }*/
            }).catch((err) => {
                console.error("Key.decrypt:WRONG_KEY", err);
                return null;
            });
        });
    }
    encryptFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const fr = new FileReader();
            return new Promise(resolve => {
                fr.onloadstart = () => __awaiter(this, void 0, void 0, function* () {
                    //console.log('Loading file...')
                });
                fr.onload = () => __awaiter(this, void 0, void 0, function* () {
                    const salt = webcrypto.getRandomValues(new Uint8Array(16));
                    const derivedKey = yield this.deriveEncryptionSecretKey(salt);
                    const iv = webcrypto.getRandomValues(new Uint8Array(16));
                    const content = new Uint8Array(fr.result);
                    subtle.encrypt({
                        iv,
                        name: 'AES-GCM'
                    }, derivedKey, content)
                        .then((encrypted) => {
                        let encryptedContent = new Uint8Array(encrypted);
                        var blob = new Blob([iv, salt, encryptedContent], { type: 'application/octet-stream' });
                        let encFile = new File([blob], 'encryptedFile', {
                            lastModified: file.lastModified,
                            type: file.type
                        });
                        resolve([encFile, content]);
                    })
                        .catch((err) => {
                        console.error("An error occured while Encrypting the file, try again!", err);
                        resolve(null);
                    });
                });
                fr.readAsArrayBuffer(file);
            });
        });
    }
    decryptFile(file, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const fr = new FileReader();
            return new Promise(resolve => {
                fr.onloadstart = () => __awaiter(this, void 0, void 0, function* () {
                    console.info('Loading file...');
                });
                fr.onload = () => __awaiter(this, void 0, void 0, function* () {
                    const salt = new Uint8Array(fr.result.slice(16, 32));
                    const derivedKey = yield this.deriveDecryptionSecretKey(salt);
                    const iv = new Uint8Array(fr.result.slice(0, 16));
                    const content = new Uint8Array(fr.result.slice(32));
                    subtle.decrypt({
                        iv,
                        name: 'AES-GCM'
                    }, derivedKey, content)
                        .then((decrypted) => {
                        let opts = {};
                        if (type) {
                            opts.type = type;
                        }
                        let blob = new Blob([new Uint8Array(decrypted)], opts);
                        resolve(blob);
                    })
                        .catch((err) => {
                        console.error("Key.decryptFile:WRONG_KEY", err);
                        resolve(null);
                    });
                });
                fr.readAsArrayBuffer(file);
            });
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
            let exported = yield subtle.exportKey(this.type, this.key);
            //console.log('EXP:BYTES2')
            this._bytes = new Uint8Array(exported);
            //console.log('EXP:BYTES3')
            return this._bytes;
        });
    }
    base64() {
        return btoa(this.toString());
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
            key._pair = yield subtle.generateKey({
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
            return subtle.deriveKey({
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
            if (raw instanceof crypto.webcrypto.CryptoKey) {
                this._pair.privateKey = raw;
                return raw;
            }
            raw = str2ab(raw);
            let key = yield subtle.importKey('pkcs8', raw, {
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
            if (raw instanceof crypto.webcrypto.CryptoKey) {
                //console.log('IMPORT PUBLIC KEY AS CRYPTO KEY')
                this._pair.publicKey = raw;
                return raw;
            }
            //console.log('IMPORT PUBLIC KEY AS RAW')
            raw = str2ab(raw);
            let key = yield subtle.importKey('raw', raw, {
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
        if (raw instanceof crypto.webcrypto.CryptoKey) {
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
            let key = yield subtle.importKey('raw', this._raw, {
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
            this._key = yield subtle.generateKey({
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
            let result = yield subtle.verify("HMAC", yield this.key(), signature, encoded);
            return result;
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
            let signature = yield subtle.sign("HMAC", yield this.key(), encoded);
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
        if (password instanceof crypto.webcrypto.CryptoKey) {
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
        if (password instanceof crypto.webcrypto.CryptoKey) {
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
        let exported = yield subtle.exportKey('jwk', key);
        return exported;
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
        let imported = yield subtle.importKey('jwk', jwk, algo, true, jwk.key_ops);
        //console.log('imported', imported, imported instanceof crypto.webcrypto.CryptoKey)
        return imported;
    });
}
exports.importJwk = importJwk;
function jwkToPem(jwk, opts = {}) {
    let str = btoa(JSON.stringify(jwk)).replace(/(.{64})/gm, '$1\n').replace(/\s$/, '');
    let type = opts.private ? 'PRIVATE ' : (opts.hmac ? '' : 'PUBLIC ');
    return `-----BEGIN ${type}KEY-----
${str}
-----END ${type}KEY-----`;
}
exports.jwkToPem = jwkToPem;
function pemToJwk(pem) {
    let jwkStr = atob(pem.replace(/-----(BEGIN|END)(.*)-----/g, '').replace(/\s/g, ''));
    //console.log('JWKSTR', jwkStr)
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
function sharedKey(privateKey, publicKey) {
    return __awaiter(this, void 0, void 0, function* () {
        return subtle.deriveKey({
            name: 'ECDH',
            public: publicKey
        }, privateKey, {
            name: 'AES-GCM',
            length: 256
        }, true, ['encrypt', 'decrypt']);
    });
}
exports.sharedKey = sharedKey;
//# sourceMappingURL=index.js.map