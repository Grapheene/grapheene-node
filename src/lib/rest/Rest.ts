import axios, {AxiosInstance, AxiosResponse} from "axios";
import * as fs from "fs";

const FormData = require('form-data');

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

    download(endpoint: string, params?: any) :Promise<string> {
        const config: any = {
            url: endpoint,
            headers: this._headers || null,
            method: 'get',
            responseType: 'stream'
        }
        if (!params.hasOwnProperty('path')) {
            throw new Error('Local path for downloading cloud data must be defined')
        }

        const writer = fs.createWriteStream(params.path)
        config.headers["Content-Type"] = 'application/json'

        return this._instance.request(config).then((response) => {
            return new Promise((resolve, reject) => {
                response.data.pipe(writer);
                let error: null | Error = null;
                writer.on('error', err => {
                    error = err;
                    writer.close();
                    reject(err);
                });
                writer.on('close', () => {
                    if (!error) {
                        resolve(params.path);
                    }
                });
            })
        });

    }

    put(endpoint: string, params?: any) {
        return this._request(endpoint, 'PUT', params)
    }

    multiPartForm(endpoint: string, params: any) {
        return this._request(endpoint, 'FORM', params)
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

        config.headers["Content-Type"] = 'application/json'

        if (config.method === 'get') {
            config.params = params;
        }

        if (config.method !== 'get' && config.method !== 'del' && config.method !== 'form') {
            config.data = params;
        }

        if (config.method === 'form') {
            const bodyFormData = new FormData();
            for (let x in params) {
                bodyFormData.append(x, params[x])
            }
            config.data = bodyFormData;
            config.method = 'post';
            config.headers["Content-Type"] = "multipart/form-data; boundary=" + bodyFormData.getBoundary();
        }


        return this._instance.request(config)
    }

}

export default Rest
