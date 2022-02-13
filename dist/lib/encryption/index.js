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
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptFile = exports.encryptFile = exports.decrypt = exports.encrypt = exports.configureKeys = void 0;
const GCrypto = __importStar(require("./Crypto"));
const fs = require("fs-extra");
const configureKeys = (keys) => __awaiter(void 0, void 0, void 0, function* () {
    let hmac, privateKey, publicKey;
    if (keys.hasOwnProperty('hmac')) {
        hmac = yield GCrypto.importJwk(GCrypto.pemToJwk(keys.hmac));
    }
    if (keys.hasOwnProperty('privateKey')) {
        privateKey = yield GCrypto.importJwk(GCrypto.pemToJwk(keys.privateKey));
    }
    if (keys.hasOwnProperty('publicKey')) {
        publicKey = yield GCrypto.importJwk(GCrypto.getPublicJwk(GCrypto.pemToJwk(keys.privateKey)));
    }
    return {
        privateKey: privateKey,
        publicKey: publicKey,
        hmac: hmac
    };
});
exports.configureKeys = configureKeys;
const encrypt = (data, keys) => {
    return new Promise((resolve, reject) => {
        (0, exports.configureKeys)(keys)
            .then((secrets) => __awaiter(void 0, void 0, void 0, function* () {
            let ecdh = new GCrypto.ECDHKeyPair();
            yield ecdh.importPrivateKey(secrets.privateKey);
            yield ecdh.importPublicKey(secrets.publicKey);
            let aesKey = yield ecdh.deriveKey(ecdh.publicKey);
            resolve(yield GCrypto.encrypt(data, aesKey));
        }))
            .catch(reject);
    });
};
exports.encrypt = encrypt;
const decrypt = (encrypted, keys) => {
    return new Promise((resolve, reject) => {
        (0, exports.configureKeys)(keys)
            .then((secrets) => __awaiter(void 0, void 0, void 0, function* () {
            let ecdh = new GCrypto.ECDHKeyPair();
            yield ecdh.importPrivateKey(secrets.privateKey);
            yield ecdh.importPublicKey(secrets.publicKey);
            let aesKey = yield ecdh.deriveKey(ecdh.publicKey);
            GCrypto.decrypt(encrypted, aesKey)
                .then((decrypted) => {
                resolve(decrypted);
            });
        }))
            .catch(reject);
    });
};
exports.decrypt = decrypt;
const encryptFile = (filePath, keys) => {
    return new Promise((resolve, reject) => {
        (0, exports.configureKeys)(keys)
            .then((secrets) => __awaiter(void 0, void 0, void 0, function* () {
            let ecdh = new GCrypto.ECDHKeyPair();
            yield ecdh.importPrivateKey(secrets.privateKey);
            yield ecdh.importPublicKey(secrets.publicKey);
            let aesKey = yield ecdh.deriveKey(ecdh.publicKey);
            const encrypted = yield GCrypto.encryptFileStream(filePath, aesKey);
            resolve(true);
        }))
            .catch((e) => {
            console.log(e);
            reject(e);
        });
    });
};
exports.encryptFile = encryptFile;
const decryptFile = (filePath, keys) => {
    return new Promise((resolve, reject) => {
        (0, exports.configureKeys)(keys)
            .then((secrets) => __awaiter(void 0, void 0, void 0, function* () {
            let ecdh = new GCrypto.ECDHKeyPair();
            yield ecdh.importPrivateKey(secrets.privateKey);
            yield ecdh.importPublicKey(secrets.publicKey);
            let aesKey = yield ecdh.deriveKey(ecdh.publicKey);
            const decrypted = yield GCrypto.decryptFileStream(filePath, aesKey);
            resolve(true);
        }))
            .catch(reject);
    });
};
exports.decryptFile = decryptFile;
//# sourceMappingURL=index.js.map