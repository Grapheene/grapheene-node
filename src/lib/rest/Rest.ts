import axios, {AxiosInstance, AxiosResponse} from "axios";

class Rest {
    protected _instance: AxiosInstance;
    protected _headers: any = {};

    constructor(base_url: string) {
        this._instance = axios.create({
            baseURL: base_url,
            timeout: 60000
        });
    }

    setHeaders(headers: any) {
        this._headers = headers;
        return this;
    }

    post(endpoint: string, params?: any) {
        return this._request(endpoint, 'POST', params)
    }

    get(endpoint: string, params?: any) {
        return this._request(endpoint, 'GET', params)
    }

    put(endpoint: string, params?: any) {
        return this._request(endpoint, 'PUT', params)
    }

    del(endpoint: string) {
        return this._request(endpoint, 'DELETE')
    }

    private _request(endpoint: string, method: string, params?: any) {
        const config: any = {
            url: endpoint,
            headers: this._headers || null,
            method: method.toLowerCase()
        }

        if (config.method === 'get') {
            config.params = params;
        }

        if (config.method !== 'get' && config.method !== 'del') {
            config.data = params;
        }
        return this._instance.request(config)
    }

}

export default Rest
