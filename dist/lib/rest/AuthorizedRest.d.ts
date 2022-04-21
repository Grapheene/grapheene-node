import Rest from "./Rest";
import { Zokrates } from "../zk/Zokrates";
declare class AuthorizedRest extends Rest {
    private zk;
    private _token;
    private _rsa;
    readonly _clientId: string;
    readonly _authDir: string;
    readonly _base_url: string;
    constructor(base_url: string, clientId: string, zk: Zokrates, authDir: string);
    init(): Promise<unknown>;
    private updateRestHeaders;
    ensureHeaders(): Promise<void>;
    post(endpoint: string, params?: any): Promise<import("axios").AxiosResponse<any, any>>;
    get(endpoint: string, params?: any): Promise<import("axios").AxiosResponse<any, any>>;
    put(endpoint: string, params?: any): Promise<import("axios").AxiosResponse<any, any>>;
    del(endpoint: string): Promise<import("axios").AxiosResponse<any, any>>;
    private isJWTValid;
    private refreshJWT;
    private auth;
}
export default AuthorizedRest;
