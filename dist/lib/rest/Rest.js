"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
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
        const config = {
            url: endpoint,
            headers: this._headers || null,
            method: 'get',
            responseType: 'stream'
        };
        if (!params.hasOwnProperty('path')) {
            throw new Error('Local path for downloading cloud data must be defined');
        }
        const writer = fs.createWriteStream(params.path);
        config.headers["Content-Type"] = 'application/json';
        return this._instance.request(config).then((response) => {
            return new Promise((resolve, reject) => {
                response.data.pipe(writer);
                let error = null;
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
            });
        });
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