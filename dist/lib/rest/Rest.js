"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const FormData = require('form-data');
class Rest {
    constructor(base_url) {
        this._headers = {};
        this._instance = axios_1.default.create({
            baseURL: base_url,
            timeout: 60000
        });
    }
    setHeaders(headers) {
        this._headers = headers;
        return this;
    }
    post(endpoint, params) {
        return this._request(endpoint, 'POST', params);
    }
    get(endpoint, params) {
        return this._request(endpoint, 'GET', params);
    }
    download(endpoint, params) {
        return this._request(endpoint, 'DOWNLOAD', params);
    }
    put(endpoint, params) {
        return this._request(endpoint, 'PUT', params);
    }
    multiPartForm(endpoint, params) {
        return this._request(endpoint, 'FORM', params);
    }
    del(endpoint) {
        return this._request(endpoint, 'DELETE');
    }
    _request(endpoint, method, params) {
        const config = {
            url: endpoint,
            headers: this._headers || null,
            method: method.toLowerCase()
        };
        config.headers["Content-Type"] = 'application/json';
        if (config.method === 'get') {
            config.params = params;
        }
        if (config.method === 'download') {
            config.responseType = 'blob';
            config.method = 'get';
        }
        if (config.method !== 'get' && config.method !== 'del' && config.method !== 'form') {
            config.data = params;
        }
        if (config.method === 'form') {
            const bodyFormData = new FormData();
            for (let x in params) {
                bodyFormData.append(x, params[x]);
            }
            config.data = bodyFormData;
            config.method = 'post';
            config.headers["Content-Type"] = "multipart/form-data; boundary=" + bodyFormData.getBoundary();
        }
        return this._instance.request(config);
    }
}
exports.default = Rest;
//# sourceMappingURL=Rest.js.map