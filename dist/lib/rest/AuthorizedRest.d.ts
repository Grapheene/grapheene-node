import Rest from "./Rest";
import { Zokrates } from "../zk/Zokrates";
declare class AuthorizedRest extends Rest {
    private tokenManager;
    private zk;
    constructor(base_url: string, clientId: string, zk: Zokrates, authDir: string);
    private updateRestHeaders;
    ensureHeaders(): Promise<void>;
    post(endpoint: string, params?: any): Promise<import("axios").AxiosResponse<any, any>>;
    get(endpoint: string, params?: any): Promise<import("axios").AxiosResponse<any, any>>;
    put(endpoint: string, params?: any): Promise<import("axios").AxiosResponse<any, any>>;
    del(endpoint: string): Promise<import("axios").AxiosResponse<any, any>>;
}
export default AuthorizedRest;
