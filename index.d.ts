import {AxiosInstance} from "axios";
import * as crypto from "crypto";
import KeyRingData from "./src/lib/kmf/KeyRingData";
import Member from "./src/lib/kmf/Member";
import Key from "./src/lib/kmf/Key";

export interface KmsOptions {
    client_id: string;
    api_key: string;
    rest_client: AxiosInstance;
}

export interface TokenManagerOptions {
    proof: string;
    authDir: string;
    onUpdate: Function;
}

export interface Proof {
    proof: ProofBody;
    inputs: Array<string>
}

interface ProofBody {
    a: Array<string>;
    b: Array<string>;
    c: Array<string>;
}

interface CryptoKeys {
    secretKey: crypto.KeyObject;
    privateKey: crypto.KeyObject;
    publicKey: crypto.KeyObject;
    hmac: crypto.KeyObject;
}

interface AuthHeaders {
    Token: string;
    Key: string;
}

interface KeyRingOptions {
    uuid: string;
    uniqueName: string;
    name: string;
    data: Array<KeyRingData>
    members: Array<KeyRingMember>
    createdAt: string;
    updatedAt: string;
}

interface KeyRingMember {
    role: string;
    Member: Member;
}


declare enum StorageServices {
    S3 = 's3',
    LOCAL = 'local',
    UNSAVED = 'unsaved'
}

interface KeyRingDataOptions {
    uuid: string;
    uniqueName: string;
    uniquePath: string;
    name: string;
    path: string;
    service: StorageServices;
}

interface MemberOptions {
    uuid?: string;
    name: string;
    keys?: Array<Key>;
}

interface KeyOptions {
    uuid: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    data?: KeyData;
}

interface KeyData {
    privateKey?: string;
    hmac?: string;
    publicKey?: string;
}

declare enum KeyDataEnum {
    privateKey = 'privateKey',
    hmac = 'hmac',
    publicKey = 'publicKey'
}
