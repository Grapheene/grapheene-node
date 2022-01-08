"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class KeyStore {
    static setPrivateKey(raw, encrypted) {
        if (!raw)
            return;
        let data = JSON.stringify({
            raw, encrypted
        });
        sessionStorage.setItem('privateKey', data);
    }
    static get privateKey() {
        let key = JSON.parse(sessionStorage.getItem('privateKey') || '{}');
        return key.raw;
    }
    static setSecretKey(raw, encrypted) {
        if (!raw)
            return;
        let data = JSON.stringify({
            raw, encrypted
        });
        sessionStorage.setItem('secretKey', data);
    }
    static get secretKey() {
        let key = JSON.parse(sessionStorage.getItem('secretKey') || '{}');
        return key.raw;
    }
    static set publicKey(value) {
        if (!value)
            return;
        sessionStorage.setItem('publicKey', value);
    }
    static get publicKey() {
        return sessionStorage.getItem('publicKey');
    }
    static setHMAC(raw, encrypted) {
        if (!raw)
            return;
        let data = JSON.stringify({
            raw, encrypted
        });
        sessionStorage.setItem('hmac', data);
    }
    static get HMAC() {
        let key = JSON.parse(sessionStorage.getItem('secretKey') || '{}');
        return key.raw;
    }
    static isEncrypted(keyName) {
        let key = JSON.parse(sessionStorage.getItem(keyName) || '{}');
        return !!key.encrypted;
    }
}
exports.default = KeyStore;
//# sourceMappingURL=KeyStore.js.map