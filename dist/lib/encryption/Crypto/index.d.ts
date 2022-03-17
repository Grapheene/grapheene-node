/// <reference types="node" />
import * as crypto from "crypto";
export declare class AESKey {
    _password: any;
    _key: any;
    constructor(options?: any);
    encrypted(password: string): Promise<{
        encryptedKey: any;
        key: any;
    }>;
    importSecretKey(password?: string): Promise<any>;
    deriveEncryptionSecretKey(salt: any, secretKey?: crypto.webcrypto.CryptoKey): Promise<any>;
    deriveDecryptionSecretKey(salt: any, secretKey?: crypto.webcrypto.CryptoKey): Promise<any>;
    encrypt(bytes: any): Promise<any>;
    _encrypt(bytes: any, salt: any, derivedKey: any): Promise<any>;
    decrypt(bytes: any): Promise<any>;
    encryptFileStream(filePath: string): Promise<unknown>;
    decryptFileStream(filePath: string): Promise<unknown>;
    encryptFile(file: any): Promise<unknown>;
    decryptFile(file: any, type?: any): Promise<unknown>;
    export(): Promise<ExportedKey>;
}
declare class ExportedKey {
    key: crypto.KeyObject;
    type: any;
    _bytes: Uint8Array;
    constructor(key: crypto.KeyObject, type?: string);
    bytes(): Promise<Uint8Array>;
    base64(): string;
    pem(): string;
    toString(): any;
    toHex(): string;
    encrypt(password: string): Promise<any>;
}
export declare class ECDHKeyPair {
    _pair: any;
    _raw: any;
    constructor(raw?: any);
    static generate(): Promise<ECDHKeyPair>;
    get privateKey(): any;
    get publicKey(): any;
    deriveKey(publicKey: any): Promise<any>;
    exportPrivateKey(): Promise<ExportedKey>;
    exportPublicKey(): Promise<ExportedKey>;
    exportDerivedAESKey(publicKey: any): Promise<ExportedKey>;
    importPrivateKey(raw: any): Promise<any>;
    importPublicKey(raw: any): Promise<any>;
}
export declare class HMAC {
    _password: string;
    _secretKey: string;
    _salt: string;
    _raw: any;
    _key: any;
    useSalt: boolean;
    constructor(raw?: any, useSalt?: boolean);
    importKey(): Promise<any>;
    key(): Promise<any>;
    verify(message: any, signature: any): Promise<any>;
    sign(message: any): Promise<string>;
    export(): Promise<ExportedKey>;
}
export declare function str2ab(str: any): ArrayBuffer;
export declare function ab2str(buf: any): any;
export declare function bytesToHex(bytes: any): string;
export declare function hexToBytes(hex: any): Uint8Array;
export declare function generateRandomString(): any;
export declare function decrypt(data: any, password: any): Promise<any>;
export declare function encrypt(data: any, password: any): Promise<any>;
export declare function encryptHex(data: any, password: any): Promise<string>;
export declare function decryptFile(file: any, password: any, type?: any): Promise<unknown>;
export declare function encryptFile(file: any, password: any): Promise<any[]>;
export declare function encryptFileStream(file: any, password: any): Promise<any>;
export declare function decryptFileStream(file: any, password: any): Promise<any>;
export declare function generateEncryptedKey(password: any): Promise<{
    encryptedKey: any;
    key: any;
}>;
export declare function hmacSign(msg: any, key: any): Promise<any>;
export declare function exportJwk(key: any): Promise<any>;
export declare function importJwk(jwk: any): Promise<any>;
export declare function jwkToPem(jwk: any, opts?: any): string;
export declare function pemToJwk(pem: any): any;
export declare function getPublicJwk(jwk: any): any;
export {};
