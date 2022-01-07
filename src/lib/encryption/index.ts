import {RawKeys} from "../../../index";
import * as GCrypto from "./Crypto";
import {KeyObject} from "crypto";

export const configureKeys = async (keys: RawKeys) => {

    let hmac = await GCrypto.importJwk(GCrypto.pemToJwk(keys.hmac))
    let privateKey = await GCrypto.importJwk(GCrypto.pemToJwk(keys.privateKey))
    let publicKey = await GCrypto.importJwk(GCrypto.getPublicJwk(GCrypto.pemToJwk(keys.privateKey)))
    let secretKey = await GCrypto.sharedKey(privateKey, publicKey)
    return {
        secretKey: secretKey,
        privateKey: privateKey,
        publicKey: publicKey,
        hmac: hmac
    }
}

export const encrypt = (data: string | object | number, keys: RawKeys) => {
    return new Promise((resolve, reject) => {
        configureKeys(keys)
            .then(async (secrets: any) => {
                let ecdh = new GCrypto.ECDHKeyPair()
                await ecdh.importPrivateKey(secrets.privateKey)

                await ecdh.importPublicKey(await GCrypto.importJwk(GCrypto.pemToJwk(keys.publicKey)))

                let aesKey = await ecdh.deriveKey(ecdh.publicKey)
                resolve(await GCrypto.encrypt(data, aesKey))

            })
            .catch(reject)
    })
};

export const decrypt = (encrypted: string, keys: RawKeys) => {
    return new Promise((resolve, reject) => {
        configureKeys(keys)
            .then(async (secrets: any) => {
                let ecdh = new GCrypto.ECDHKeyPair()
                await ecdh.importPrivateKey(secrets.privateKey)
                await ecdh.importPublicKey(await GCrypto.importJwk(GCrypto.pemToJwk(keys.publicKey)))
                let aesKey = await ecdh.deriveKey(ecdh.publicKey)
                GCrypto.decrypt(encrypted, aesKey)
                    .then((decrypted) => {
                        resolve(decrypted)
                    })
            })
            .catch(reject)
    })
};

