import { AxiosInstance, AxiosResponse } from "axios";
declare class Rest {
    protected _instance: AxiosInstance;
    protected _headers: any;
    constructor(base_url: string);
    setHeaders(headers: any): this;
    post(endpoint: string, params?: any): Promise<AxiosResponse<any, any>>;
    get(endpoint: string, params?: any): Promise<AxiosResponse<any, any>>;
    download(endpoint: string, params?: any): Promise<string>;
    put(endpoint: string, params?: any): Promise<AxiosResponse<any, any>>;
    multiPartForm(endpoint: string, params: any): Promise<AxiosResponse<any, any>>;
    del(endpoint: string): Promise<AxiosResponse<any, any>>;
    private _request;
}
export default Rest;
