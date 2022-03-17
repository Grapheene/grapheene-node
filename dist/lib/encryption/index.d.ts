/// <reference types="node" />
import { KeyData } from "../../../index";
import * as crypto from "crypto";
export declare const configureKeys: (keys: KeyData) => Promise<{
    privateKey: crypto.KeyObject;
    publicKey: crypto.KeyObject;
    hmac: crypto.KeyObject;
}>;
export declare const encrypt: (data: string | object | number, keys: KeyData) => Promise<string>;
export declare const decrypt: (encrypted: string, keys: KeyData) => Promise<string>;
export declare const encryptFile: (filePath: string, keys: KeyData) => Promise<any>;
export declare const decryptFile: (filePath: string, keys: KeyData) => Promise<any>;
