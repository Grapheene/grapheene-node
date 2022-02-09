import * as crypto from "crypto";

const atob = require('atob');
const btoa = require('btoa');
const FileReader = require('filereader');
const fs = require("fs-extra")
const path = require("path")

let webcrypto: any, CryptoKeyInstance: any;

if (typeof window === "undefined") {
    webcrypto = require('crypto').webcrypto;
    CryptoKeyInstance = crypto.webcrypto.CryptoKey;
} else {
    webcrypto = window.crypto;
    CryptoKeyInstance = CryptoKey;
}

export class AESKey {
    _password
    _key

    constructor(options?: any) {
        if (options.key instanceof CryptoKeyInstance) {
            this._key = options.key
        } else {
            this._password = options.password
            if (!options.password) {
                this._password = generateRandomString()
            }
        }
    }

    async encrypted(password: string) {
        const salt = webcrypto.getRandomValues(new Uint8Array(16))
        const secretKey = await this.importSecretKey(password)
        const derivedKey = await this.deriveEncryptionSecretKey(salt, secretKey)
        let encryptedKey = await this._encrypt(this._password, salt, derivedKey)
        return {encryptedKey, key: this._password}
    }

    async importSecretKey(password?: string) {
        if (this._key) return this._key
        if (!password) {
            password = this._password
        }
        let rawPassword = str2ab(password)
        return webcrypto.subtle.importKey(
            "raw",
            rawPassword,
            {
                name: 'PBKDF2'
            },
            false,
            ['deriveKey']
        )
    }

    async deriveEncryptionSecretKey(salt: any, secretKey?: crypto.webcrypto.CryptoKey) {
        if (this._key) return this._key
        if (!secretKey) {
            secretKey = await this.importSecretKey()
        }
        return webcrypto.subtle.deriveKey({
                name: 'PBKDF2',
                salt: salt,
                iterations: 80000,
                hash: {
                    name: 'SHA-256'
                },
            },
            <CryptoKey>secretKey,
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt', 'decrypt']
        )
    }

    async deriveDecryptionSecretKey(salt: any, secretKey?: crypto.webcrypto.CryptoKey) {

        if (this._key) return this._key
        if (!secretKey) {
            secretKey = await this.importSecretKey()
        }
        return webcrypto.subtle.deriveKey({
                name: 'PBKDF2',
                salt: salt,
                iterations: 80000,
                hash: {
                    name: 'SHA-256'
                },
            },
            <CryptoKey>secretKey,
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt', 'decrypt']
        )
    }

    async encrypt(bytes: any) {
        const salt = webcrypto.getRandomValues(new Uint8Array(16))
        const derivedKey = await this.deriveEncryptionSecretKey(salt)

        return this._encrypt(bytes, salt, derivedKey)
    }

    async _encrypt(bytes: any, salt: any, derivedKey: any) {
        if (typeof bytes === 'string') {
            bytes = str2ab(bytes)
        }
        const iv = webcrypto.getRandomValues(new Uint8Array(16))
        const content = new Uint8Array(bytes)
        return webcrypto.subtle.encrypt({
            iv,
            name: 'AES-GCM'
        }, derivedKey, content)
            .then((encrypted: any) => {
                let encryptedContent = new Uint8Array(encrypted)
                let len = iv.length + salt.length + encryptedContent.length
                let x = new Uint8Array(len)
                x.set(iv)
                x.set(salt, iv.length)
                x.set(encryptedContent, salt.length + iv.length)

                return x
            })
            .catch((err: Error) => {
                console.error("An error occured while Encrypting the file, try again!", err)
                return {}
            })
    }

    async decrypt(bytes: any) {
        if (typeof bytes === 'string') {
            bytes = str2ab(bytes)
        }
        bytes = new Uint8Array(bytes)
        const salt = new Uint8Array(bytes.slice(16, 32))
        const iv = new Uint8Array(bytes.slice(0, 16))
        const content = new Uint8Array(bytes.slice(32))
        const derivedKey = await this.deriveDecryptionSecretKey(salt)

        return webcrypto.subtle.decrypt({
            iv,
            name: 'AES-GCM'
        }, derivedKey, content)
            .then((decrypted: any) => {
                return new Uint8Array(decrypted)
                /*return {
                  bytes: dec,
                  utf8: ()=>ab2str(dec),
                  hex: ()=>bytesToHex(dec)
                }*/
            }).catch((err: Error): any => {
                console.error("Key.decrypt:WRONG_KEY", err)
                return null
            })
    }

    async encryptFileStream(filePath: string) {
        const sp = filePath.split(path.sep);
        const fileName = sp[sp.length - 1];
        const outPath = filePath.replace(fileName, `enc_${fileName}`);
        const rs = fs.createReadStream(filePath);
        const of = fs.createWriteStream(outPath);
        return new Promise((resolve, reject) => {

            rs.on('open', () => {
                console.log('File opened')
            })
            rs.on('data', async (chunk: any) => {
                const encrypted = await this.encrypt(chunk);
                if(encrypted){
                    of.write(encrypted);
                }
            })
            rs.on('close', () => {
                console.log('File closed')
            })

            rs.on('end', function () {
                let s = this;
                fs.unlinkSync(filePath);
                fs.rename(outPath, filePath)
                    .then(() => {
                        s.destroy();
                        resolve(true)
                    })
            })
            rs.on('error', (err: Error) => {
                reject(err.message)
            })
        })
    }

    async decryptFileStream(filePath: string) {
        const sp = filePath.split(path.sep);
        const fileName = sp[sp.length - 1];
        const outPath = filePath.replace(fileName, `denc_${fileName}`);
        const rs = fs.createReadStream(filePath);
        const of = fs.createWriteStream(outPath);
        return new Promise((resolve, reject) => {

            rs.on('open', () => {
                console.log('File opened')
            })
            rs.on('data', async (chunk: any) => {
                const decrypted = await this.decrypt(chunk);
                if(decrypted){
                    of.write(decrypted);
                }
            })
            rs.on('close', () => {
                console.log('File closed')
            })

            rs.on('end', function () {
                let s = this;
                fs.unlinkSync(filePath);
                fs.rename(outPath, filePath)
                    .then(() => {
                        s.destroy();
                        resolve(true)
                    })
            })
            rs.on('error', (err: Error) => {
                reject(err.message)
            })
        })
    }

    async encryptFile(file: any) {
        const fr: any = new FileReader()
        return new Promise(resolve => {
            fr.onloadstart = async () => {
                console.log('Loading file...')
            }
            fr.onload = async () => {
                const salt = webcrypto.getRandomValues(new Uint8Array(16))
                const derivedKey = await this.deriveEncryptionSecretKey(salt)
                const iv = webcrypto.getRandomValues(new Uint8Array(16))
                const content = new Uint8Array(fr.result)
                webcrypto.subtle.encrypt({
                    iv,
                    name: 'AES-GCM'
                }, derivedKey, content)
                    .then((encrypted: any) => {
                        const encryptedContent = new Uint8Array(encrypted)
                        const blob = new Blob([iv, salt, encryptedContent], {type: 'application/octet-stream'})
                        const encFile = new File([blob], 'encryptedFile', {
                            lastModified: file.lastModified,
                            type: file.type
                        })
                        resolve([encFile, content])
                    })
                    .catch((err: Error) => {
                        console.error("An error occured while Encrypting the file, try again!", err)
                        resolve(null)
                    })
            }
            fr.readAsArrayBuffer(file)
        })
    }

    async decryptFile(file: any, type?: any) {
        const fr: any = new FileReader()
        return new Promise(resolve => {
            fr.onloadstart = async () => {
                console.info('Loading file...')
            }
            fr.onload = async () => {
                const salt = new Uint8Array(fr.result.slice(16, 32))
                const derivedKey = await this.deriveDecryptionSecretKey(salt)
                const iv = new Uint8Array(fr.result.slice(0, 16))
                const content = new Uint8Array(fr.result.slice(32))
                webcrypto.subtle.decrypt({
                    iv,
                    name: 'AES-GCM'
                }, derivedKey, content)
                    .then((decrypted: any) => {
                        let opts: any = {}
                        if (type) {
                            opts.type = type
                        }
                        let blob = new Blob([new Uint8Array(decrypted)], opts)
                        resolve(blob)
                    })
                    .catch((err: Error) => {
                        console.error("Key.decryptFile:WRONG_KEY", err)
                        resolve(null)
                    })
            }
            fr.readAsArrayBuffer(file)
        })
    }

    async export() {
        let secretKey = await this.importSecretKey()
        let exported = new ExportedKey(secretKey)
        await exported.bytes()
        return exported
    }
}

class ExportedKey {
    key: crypto.KeyObject;
    type: any;
    _bytes: Uint8Array;

    constructor(key: crypto.KeyObject, type?: string) {
        this.key = key
        this.type = type || 'raw'
    }

    async bytes() {
        //console.log('EXP:BYTES1', this.type, this.key)
        let exported: any = await webcrypto.subtle.exportKey(
            this.type,
            this.key
        )
        //console.log('EXP:BYTES2')
        this._bytes = new Uint8Array(exported)
        //console.log('EXP:BYTES3')
        return this._bytes
    }

    base64() {
        return btoa(this.toString())
    }

    pem() {
        let str = this.base64().replace(/(.{64})/gm, '$1\n')
        return `-----BEGIN PRIVATE KEY-----\n${str}\n-----END PRIVATE KEY-----`
    }

    toString() {
        return ab2str(this._bytes)
    }

    toHex() {
        return bytesToHex(this._bytes)
    }

    async encrypt(password: string) {
        let encryptionKey = new AESKey({password})
        let encrypted = await encryptionKey.encrypt(this._bytes)
        return ab2str(encrypted)
    }
}

export class ECDHKeyPair {
    _pair: any = {}
    _raw

    constructor(raw?: any) {
        this._raw = raw
    }

    static async generate() {
        let key = new ECDHKeyPair()
        key._pair = await webcrypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: 'P-384'
            },
            true,
            ["deriveKey", "deriveBits"]
        )
        return key
    }

    get privateKey() {
        return this._pair.privateKey
    }

    get publicKey() {
        return this._pair.publicKey
    }

    async deriveKey(publicKey: any) {
        return webcrypto.subtle.deriveKey(
            {
                name: 'ECDH',
                public: publicKey
            },
            this.privateKey,
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        )
    }

    async exportPrivateKey() {
        //console.log('EPK1')
        let exported = new ExportedKey(this.privateKey, 'pkcs8')
        //console.log('EPK2')
        await exported.bytes()
        //console.log('EPK3')
        return exported
    }

    async exportPublicKey() {
        let exported = new ExportedKey(this.publicKey)
        await exported.bytes()
        return exported
    }

    async exportDerivedAESKey(publicKey: any) {
        let aes = await this.deriveKey(publicKey)
        let exported = new ExportedKey(aes)
        await exported.bytes()
        return exported
    }

    async importPrivateKey(raw: any) {
        if (raw instanceof CryptoKeyInstance) {
            this._pair.privateKey = raw
            return raw
        }
        raw = str2ab(raw)
        let key = await webcrypto.subtle.importKey(
            'pkcs8',
            raw,
            {
                name: "ECDH",
                namedCurve: 'P-384'
            },
            true,
            ['deriveKey', 'deriveBits']
        )
        if (!this._pair) this._pair = {}
        this._pair.privateKey = key
        return key
    }

    async importPublicKey(raw: any) {
        //console.log('IMPORT PUBLIC KEY')
        if (raw instanceof CryptoKeyInstance) {
            //console.log('IMPORT PUBLIC KEY AS CRYPTO KEY')
            this._pair.publicKey = raw
            return raw
        }
        //console.log('IMPORT PUBLIC KEY AS RAW')
        raw = str2ab(raw)
        let key = await webcrypto.subtle.importKey(
            'raw',
            raw,
            {
                name: "ECDH",
                namedCurve: 'P-384'
            },
            true,
            []
        )
        if (!this._pair) this._pair = {}
        this._pair.publicKey = key
        return key
    }
}

export class HMAC {
    _password: string;
    _secretKey: string;
    _salt: string;
    _raw: any;
    _key: any;
    useSalt: boolean;

    constructor(raw?: any, useSalt?: boolean) {
        this.useSalt = useSalt
        if (raw instanceof CryptoKeyInstance) {
            this._key = raw
        } else if (raw) {
            this._raw = str2ab(raw)
        }
    }

    async importKey() {
        if (this._key) {
            return this._key
        }
        let key = await webcrypto.subtle.importKey(
            'raw',
            this._raw,
            {
                name: 'HMAC',
                hash: 'SHA-256',
            },
            true,
            ['sign', 'verify']
        )
        this._key = key
        return key
    }

    async key() {
        if (this._key) return this._key
        if (this._raw) {
            return this.importKey()
        }
        this._key = await webcrypto.subtle.generateKey(
            {
                name: 'HMAC',
                hash: 'SHA-256'
            },
            true,
            ['sign', 'verify']
        )
        return this._key
    }

    async verify(message: any, signature: any) {
        let salt
        if (typeof signature === 'string') {
            if (!signature.match(/[^A-Fa-f0-9]+/)) {
                if (this.useSalt) {
                    salt = hexToBytes(signature.slice(0, 32))
                    signature = hexToBytes(signature.slice(32))
                } else {
                    signature = hexToBytes(signature)
                }
            } else throw new Error('Malformed signature')
        }
        let encoded
        if (this.useSalt) {
            encoded = str2ab(message + ab2str(salt))
        } else {
            encoded = str2ab(message)
        }
        return await webcrypto.subtle.verify(
            "HMAC",
            await this.key(),
            signature,
            encoded
        )
    }

    async sign(message: any) {
        let salt, encoded
        if (this.useSalt) {
            salt = webcrypto.getRandomValues(new Uint8Array(16))
            encoded = str2ab(message + ab2str(salt))
        } else {
            encoded = str2ab(message)
        }
        let signature = await webcrypto.subtle.sign(
            "HMAC",
            await this.key(),
            encoded
        )

        return bytesToHex(salt) + bytesToHex(signature)
    }

    async export() {
        let secretKey = await this.key()
        let exported = new ExportedKey(secretKey)
        await exported.bytes()
        return exported
    }
}

export function str2ab(str: any) {
    const buf = new ArrayBuffer(str.length)
    const bufView = new Uint8Array(buf)
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i)
    }
    return buf
}

export function ab2str(buf: any) {
    return String.fromCharCode.apply(null, new Uint8Array(buf))
}

export function bytesToHex(bytes: any) {
    bytes = new Uint8Array(bytes)
    let hex = ''
    bytes.forEach((byte: any) => hex += (byte.toString(16) + '').padStart(2, '0'))
    return hex
}

export function hexToBytes(hex: any) {
    let match = hex.match(/.{2}/g)
    if (!match) return null
    let m = match.map((hex: any) => parseInt(hex, 16))
    return new Uint8Array(m)
}

export function generateRandomString() {
    const usedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#_+=!$%&¡-'
    let keyArray = new Uint8Array(16)
    keyArray = keyArray.map(x => usedChars.charCodeAt(x % usedChars.length))
    return String.fromCharCode.apply(null, keyArray)
}

export async function decrypt(data: any, password: any) {
    let props: any = {password}

    if (password instanceof CryptoKeyInstance) {
        props.key = password
    }

    let decryptionKey = new AESKey(props)

    let key = await decryptionKey.decrypt(data)

    if (!key) {
        return null
    }
    return ab2str(key)
}

export async function encrypt(data: any, password: any) {
    let props: any = {password}

    if (password instanceof CryptoKeyInstance) {
        props = {key: password}
    }

    let encryptionKey = new AESKey(props)

    let key = await encryptionKey.encrypt(data)

    if (!key) {
        return null
    }

    return ab2str(key)
}

export async function encryptHex(data: any, password: any) {
    let encryptionKey = new AESKey({password})
    let key = await encryptionKey.encrypt(data)
    if (!key) {
        return null
    }
    importJwk
    return bytesToHex(key)
}

export async function decryptFile(file: any, password: any, type?: any) {
    let decryptionKey = new AESKey({password})
    let key = await decryptionKey.decryptFile(file, type)
    if (!key) {
        return null
    }
    return key
}

export async function encryptFile(file: any, password: any) {
    let encryptionKey = new AESKey({password})
    let keyArray: any = await encryptionKey.encryptFile(file)
    if (!keyArray[0]) {
        return null
    }
    return [keyArray[0], keyArray[1]]
}

export async function encryptFileStream(file: any, password: any) {
    let props: any = {password}

    if (password instanceof CryptoKeyInstance) {
        props = {key: password}
    }

    let encryptionKey = new AESKey(props)

    let keyArray: any = await encryptionKey.encryptFileStream(file)
    if (!keyArray) {
        return null
    }
    return file
}

export async function decryptFileStream(file: any, password: any) {
    let props: any = {password}

    if (password instanceof CryptoKeyInstance) {
        props = {key: password}
    }

    let encryptionKey = new AESKey(props)

    let keyArray: any = await encryptionKey.decryptFileStream(file)
    if (!keyArray) {
        return null
    }
    return file
}

export async function generateEncryptedKey(password: any) {
    let key = generateRandomString()
    let encryptedKey = await encrypt(key, password)
    return {encryptedKey, key}
}

export async function hmacSign(msg: any, key: any) {
    let h: any = new HMAC(key)
    return h.sign(msg)
}

export async function exportJwk(key: any) {
    return await webcrypto.subtle.exportKey(
        'jwk',
        key
    )
}

export async function importJwk(jwk: any) {
    let type = (jwk.kty || '').toLowerCase()
    if (!type) {
        return null
    }
    let algo
    if (type == 'ec') {
        algo = {
            name: 'ECDH',
            namedCurve: jwk.crv
        }
    } else if (type == 'oct') {
        if (jwk.alg == 'HS256') {
            algo = {
                name: 'HMAC',
                hash: 'SHA-256'
            }
        }
    }
    if (!algo) {
        return null
    }
    //console.log('imported', imported, imported instanceof CryptoKeyInstance)
    return await webcrypto.subtle.importKey('jwk', jwk, algo, true, jwk.key_ops)
}

export function jwkToPem(jwk: any, opts: any = {}) {
    let str = btoa(JSON.stringify(jwk)).replace(/(.{64})/gm, '$1\n').replace(/\s$/, '')
    let type = opts.private ? 'PRIVATE ' : (opts.hmac ? '' : 'PUBLIC ')
    return `-----BEGIN ${type}KEY-----
${str}
-----END ${type}KEY-----`
}

export function pemToJwk(pem: any) {
    let jwkStr = atob(pem.replace(/-----(BEGIN|END)(.*)-----/g, '').replace(/\s/g, ''))
    //console.log('JWKSTR', jwkStr)
    let jwk
    try {
        jwk = JSON.parse(jwkStr)
        //console.log('jwk', jwk)
    } catch (e) {
        //console.log('e', e)
        return null
    }
    return jwk
}

export function getPublicJwk(jwk: any) {
    delete jwk.d
    jwk.key_ops = []
    return jwk
}
