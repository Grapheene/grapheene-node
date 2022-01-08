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
const _1 = require("./");
const KeyStore_1 = require("./KeyStore");
class KeyManagement {
    static generateAndExportKeyPair() {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('TEST1')
            let keyPair = yield _1.ECDHKeyPair.generate();
            //console.log('TEST2')
            let privateKey = yield keyPair.exportPrivateKey();
            //console.log('TEST3')
            let publicKey = yield keyPair.exportPublicKey();
            //console.log('TEST4')
            return [privateKey, publicKey];
        });
    }
    static decryptRawKey(rawKey, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let decryptionKey = new _1.AESKey({ password });
            let key = yield decryptionKey.decrypt(rawKey);
            if (!key) {
                return null;
            }
            return (0, _1.ab2str)(key);
        });
    }
    static encryptRawKey(rawKey, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let encryptionKey = new _1.AESKey({ password });
            let key = yield encryptionKey.encrypt(rawKey);
            if (!key) {
                return null;
            }
            return (0, _1.ab2str)(key);
        });
    }
    static decryptPrivateKey(password) {
        return __awaiter(this, void 0, void 0, function* () {
            let decryptionKey = new _1.AESKey({ password });
            if (KeyStore_1.default.isEncrypted('privateKey')) {
                let key = yield decryptionKey.decrypt(KeyStore_1.default.privateKey);
                if (!key) {
                    return false;
                }
                KeyStore_1.default.setPrivateKey((0, _1.ab2str)(key), false);
                return true;
            }
            else {
                return false;
            }
        });
    }
    static hmacSign(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let h = new _1.HMAC(KeyStore_1.default.HMAC);
            return h.sign(msg);
        });
    }
    static decryptSecretKey(password) {
        return __awaiter(this, void 0, void 0, function* () {
            let decryptionKey = new _1.AESKey({ password });
            if (KeyStore_1.default.isEncrypted('secretKey')) {
                let key = yield decryptionKey.decrypt(KeyStore_1.default.secretKey);
                if (!key) {
                    return false;
                }
                KeyStore_1.default.setSecretKey((0, _1.ab2str)(key), false);
                return true;
            }
            else {
                return false;
            }
        });
    }
    static decryptHMAC(password) {
        return __awaiter(this, void 0, void 0, function* () {
            let decryptionKey = new _1.AESKey({ password });
            if (KeyStore_1.default.isEncrypted('hmac')) {
                let key = yield decryptionKey.decrypt(KeyStore_1.default.secretKey);
                if (!key) {
                    return false;
                }
                KeyStore_1.default.setHMAC((0, _1.ab2str)(key), false);
                return true;
            }
            else {
                return false;
            }
        });
    }
    static generateRandomKey() {
        const usedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#_+=!$%&¡-';
        let keyArray = new Uint8Array(16);
        crypto.getRandomValues(keyArray);
        keyArray = keyArray.map(x => usedChars.charCodeAt(x % usedChars.length));
        const randomizedKey = String.fromCharCode.apply(null, keyArray);
        return randomizedKey;
    }
    static get keysLoaded() {
        return KeyStore_1.default.privateKey != null && KeyStore_1.default.secretKey != null && KeyStore_1.default.publicKey != null && KeyStore_1.default.HMAC != null;
    }
    static get keysEncrypted() {
        return KeyStore_1.default.isEncrypted('privateKey') ||
            KeyStore_1.default.isEncrypted('secretKey') ||
            KeyStore_1.default.isEncrypted('hmac');
    }
}
exports.default = KeyManagement;
KeyManagement.privateKey = null;
KeyManagement.secretKey = null;
//# sourceMappingURL=KeyManagement.js.map