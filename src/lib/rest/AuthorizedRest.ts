import Rest from "./Rest";
import {Zokrates} from "../zk/Zokrates";
import {AuthHeaders} from "../../../index";
import {promises as fs} from "fs";
import axios from "axios";

const jwt = require('jsonwebtoken')

class AuthorizedRest extends Rest {
    private zk: Zokrates;
    private _token: string;
    private _rsa: string;
    readonly _clientId: string;
    readonly _authDir: string;
    readonly _base_url: string;

    constructor(base_url: string, clientId: string, zk: Zokrates, authDir: string) {
        super(base_url)
        this._base_url = base_url
        this.zk = zk;
        this._clientId = clientId;
        this._authDir = authDir;

    }

    init() {
        return new Promise(async (resolve, reject) => {
            try {
                const tokenFile = `${this._authDir}/token`
                const rsaFile = `${this._authDir}/rsa`
                this._token = await fs.readFile(tokenFile, 'utf8')
                this._rsa = await fs.readFile(rsaFile, 'utf8')
                const valid = await this.isJWTValid()
                if (valid === 'warn' || !valid) {
                    await this.refreshJWT();
                    resolve(true)
                }
                resolve(true)
            } catch (e) {
                console.log(e)
                reject(e)
            }
        })

    }

    private updateRestHeaders(headers: AuthHeaders) {
        super.setHeaders(headers)
    }

    async ensureHeaders() {

        if (this._headers.hasOwnProperty('Token') || this._headers.hasOwnProperty('Key')) {
            const valid = await this.isJWTValid();
            if (valid === 'warn') {
                this.refreshJWT();
            }
            if (!valid) {
                await this.refreshJWT();
            }
        } else {
            await this.refreshJWT();
        }
    }

    async post(endpoint: string, params?: any) {
        await this.ensureHeaders();
        return super.post(endpoint, params)
    }

    async get(endpoint: string, params?: any) {
        await this.ensureHeaders();
        return super.get(endpoint, params)
    }

    async put(endpoint: string, params?: any) {
        await this.ensureHeaders();
        return super.put(endpoint, params)
    }

    async del(endpoint: string) {
        await this.ensureHeaders();
        return super.del(endpoint)
    }

    private isJWTValid() {
        return new Promise(async (resolve, reject) => {
            const tokenFile = `${this._authDir}/token`
            const rsaFile = `${this._authDir}/rsa`
            const token = await fs.readFile(tokenFile, 'utf8')
            const rsa = await fs.readFile(rsaFile, 'utf8')
            jwt.verify(token, rsa, {algorithms: ['RS256']}, async (err: Error, decoded: any) => {
                if (err) {
                    if (err.message === 'jwt expired') {
                        console.log('Refreshing JWT...')
                        await this.refreshJWT()
                        return resolve(true)
                    } else {
                        console.error('Unable to verify token:', err.message)
                        return reject(err.message)
                    }
                } else {
                    const unixtime = Math.floor(+new Date() / 1000)
                    if (decoded.exp - unixtime <= 300) {
                        console.warn('JWT will expire soon, we will refresh soon.')
                        return resolve('warn')
                    } else {
                        return resolve(true)
                    }
                }
            });
        })
    }

    private refreshJWT = () => {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.auth('/auth', 'POST', {uuid: this._clientId, proof: JSON.stringify(this.zk.generateProof())});
                this._token = result.data.token;
                this._rsa = result.data.publicKey;
                await fs.writeFile(`${this._authDir}/token`, this._token)
                await fs.writeFile(`${this._authDir}/rsa`, this._rsa)
                this.updateRestHeaders({Token: this._token, Key: JSON.stringify(this._rsa)})
                return resolve({Token: this._token, Key: this._rsa});
            } catch (err) {
                console.error('Unable to refresh JWT:', err);
                return reject(err);
            }
        })
    }

    private auth(endpoint: string, method: string, params: any) {
        const instance = axios.create({
            baseURL: this._base_url,
            timeout: 60000
        });
        const config: any = {
            url: endpoint,
            headers: this._headers || null,
            method: method.toLowerCase(),
            data: params
        }

        config.headers["Content-Type"] = 'application/json'

        return instance.request(config)
    }


}

export default AuthorizedRest
