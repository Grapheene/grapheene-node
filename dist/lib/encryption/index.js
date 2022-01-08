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
exports.decrypt = exports.encrypt = exports.configureKeys = void 0;
const GCrypto = require("./Crypto");
const configureKeys = (keys) => __awaiter(void 0, void 0, void 0, function* () {
    let hmac = yield GCrypto.importJwk(GCrypto.pemToJwk(keys.hmac));
    let privateKey = yield GCrypto.importJwk(GCrypto.pemToJwk(keys.privateKey));
    let publicKey = yield GCrypto.importJwk(GCrypto.getPublicJwk(GCrypto.pemToJwk(keys.privateKey)));
    let secretKey = yield GCrypto.sharedKey(privateKey, publicKey);
    return {
        secretKey: secretKey,
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
            yield ecdh.importPublicKey(yield GCrypto.importJwk(GCrypto.pemToJwk(keys.publicKey)));
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
            yield ecdh.importPublicKey(yield GCrypto.importJwk(GCrypto.pemToJwk(keys.publicKey)));
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
//# sourceMappingURL=index.js.map