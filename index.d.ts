import {AxiosInstance} from "axios";
import * as crypto from "crypto";

export interface KmsOptions {
    client_id: string;
    api_key: string;
    rest_client: AxiosInstance;
}

export interface TokenManagerOptions {
    proof: string;
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

interface RawKeys {
    secretKey: crypto.KeyObject;
    privateKey: crypto.KeyObject;
    publicKey: crypto.KeyObject;
    hmac: crypto.KeyObject;
}

interface AuthHeaders{
    Token: string;
    Key: string;
}
