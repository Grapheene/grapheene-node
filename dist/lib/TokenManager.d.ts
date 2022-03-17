import { TokenManagerOptions } from "../../index";
export declare class TokenManager {
    private _clientId;
    private _onUpdate;
    private _authDir;
    private _proof;
    private _token;
    private _rsa;
    private interval;
    private _restClient;
    ready: boolean;
    constructor(clientId: string, options: TokenManagerOptions);
    getAuth(proof: string): Promise<import("axios").AxiosResponse<any, any>>;
    private loadToken;
    private getToken;
    private auth;
    private watch;
    set proof(proof: string);
    get publicKey(): string;
    get jwt(): string;
}
