import {CryptoKeys, KeyData} from "../../../index";
import * as GCrypto from "./Crypto";
import * as crypto from "crypto";
const fs = require("fs-extra");

export const configureKeys = async (keys: KeyData) => {

    let hmac: crypto.KeyObject, privateKey: crypto.KeyObject, publicKey: crypto.KeyObject

    if(keys.hasOwnProperty('hmac')) {
        hmac = await GCrypto.importJwk(GCrypto.pemToJwk(keys.hmac))
    }
    if(keys.hasOwnProperty('privateKey')) {
        privateKey = await GCrypto.importJwk(GCrypto.pemToJwk(keys.privateKey))
    }
    if(keys.hasOwnProperty('publicKey')) {
        publicKey = await GCrypto.importJwk(GCrypto.getPublicJwk(GCrypto.pemToJwk(keys.privateKey)))
    }

    return {
        privateKey: privateKey,
        publicKey: publicKey,
        hmac: hmac
    }
}

export const encrypt = (data: string | object | number, keys: KeyData): Promise<string> => {
    return new Promise((resolve, reject) => {
        configureKeys(keys)
            .then(async (secrets: CryptoKeys) => {
                let ecdh = new GCrypto.ECDHKeyPair()
                await ecdh.importPrivateKey(secrets.privateKey)

                await ecdh.importPublicKey(secrets.publicKey)

                let aesKey = await ecdh.deriveKey(ecdh.publicKey)
                resolve(await GCrypto.encrypt(data, aesKey))

            })
            .catch(reject)
    })
};

export const decrypt = (encrypted: string, keys: KeyData): Promise<string> => {
    return new Promise((resolve, reject) => {
        configureKeys(keys)
            .then(async (secrets: CryptoKeys) => {
                let ecdh = new GCrypto.ECDHKeyPair()
                await ecdh.importPrivateKey(secrets.privateKey)
                await ecdh.importPublicKey(secrets.publicKey)
                let aesKey = await ecdh.deriveKey(ecdh.publicKey)
                GCrypto.decrypt(encrypted, aesKey)
                    .then((decrypted) => {
                        resolve(decrypted)
                    })
            })
            .catch(reject)
    })
};

export const encryptFile = (filePath: string, keys: KeyData): Promise<any> => {
    return new Promise((resolve, reject) => {
        configureKeys(keys)
            .then(async (secrets: CryptoKeys) => {
                let ecdh = new GCrypto.ECDHKeyPair()
                await ecdh.importPrivateKey(secrets.privateKey)

                await ecdh.importPublicKey(secrets.publicKey)

                let aesKey = await ecdh.deriveKey(ecdh.publicKey)

                const encrypted = await GCrypto.encryptFileStream(filePath, aesKey)
                resolve(true)

            })
            .catch((e)=>{
                console.error('Unable to configure keys for file encryption:', e);
                reject(e)
            })
    })
};

export const decryptFile = (filePath: string, keys: KeyData): Promise<any> => {
    return new Promise((resolve, reject) => {
        configureKeys(keys)
            .then(async (secrets: CryptoKeys) => {
                let ecdh = new GCrypto.ECDHKeyPair()
                await ecdh.importPrivateKey(secrets.privateKey)
                await ecdh.importPublicKey(secrets.publicKey)
                let aesKey = await ecdh.deriveKey(ecdh.publicKey)
                const decrypted = await GCrypto.decryptFileStream(filePath, aesKey)
                resolve(true)
            })
            .catch(reject)
    })
};

