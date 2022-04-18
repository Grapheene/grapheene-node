import createEmitter from "./EventFactory";
import {TokenManagerOptions} from "../../index";
import Rest from "./rest/Rest";
import {constants as fsConstants, promises as fs} from 'fs';

const config = require('../../config.json')
const jwt = require('jsonwebtoken')

export class TokenManager {
    private _clientId: string;
    private _onUpdate: Function;
    private _authDir: string;
    private _proof: string;
    private _token: string;
    private _rsa: string;
    private interval: any;
    private _restClient: Rest;
    ready: boolean = false

    constructor(clientId: string, options: TokenManagerOptions) {

        this._clientId = clientId;
        this._proof = options.proof;
        this._onUpdate = options.onUpdate;
        this._authDir = options.authDir;

    }

    init() {
        return new Promise(async (resolve, reject) => {
            try {
                await fs.mkdir(this._authDir, {recursive: true})
                this._restClient = new Rest(config.baseUrl);
                console.log('created token manager rest')
                await this.getToken(this._clientId, this._proof)
                await this.loadToken(this._clientId, this._proof);
                return resolve(true)
            } catch (err) {
                console.error('Unable to create TokenManager authDir:', err);
                return reject(err)
            }
        })

    }

    async getAuth(proof: string) {
        return await this.getToken(this._clientId, proof);
    }

    private loadToken(clientId: string, proof: string) {

        return new Promise(async (resolve, reject) => {
            try {
                const tokenFile = `${this._authDir}/token`
                const rsaFile = `${this._authDir}/rsa`
                const token = await fs.readFile(tokenFile, 'utf8')
                const rsa = await fs.readFile(rsaFile, 'utf8')
                jwt.verify(token, rsa, {algorithms: ['RS256']}, async (err: Error, decoded: any) => {
                    if (err) {
                        if (err.message === 'jwt expired') {
                            console.log('Refreshing JWT...')
                            await this.auth(this._clientId, this._proof)
                            return resolve(true)
                        } else {
                            console.error('Unable to verify token:', err.message)
                            return reject(err.message)
                        }
                    } else {
                        const unixtime = Math.floor(+new Date() / 1000)
                        if (decoded.exp - unixtime <= 300) {
                            console.log('Refreshing JWT...')
                            await this.auth(this._clientId, this._proof)
                            return resolve(true)
                        } else {
                            this._token = token;
                            this._rsa = rsa;
                            this._onUpdate({Token: this._token, Key: this._rsa})
                            this.ready = true;
                            return resolve(true)
                        }
                    }
                });
            } catch (e) {
                // ignore error
                console.log(e)
                await this.getToken(clientId, proof)
                this.ready = true
            }
        })
    }

    private async getToken(clientId: string, proof: string) {
        try {
            const result = await this._restClient.post('/auth', {uuid: clientId, proof: proof});
            this._token = result.data.token;
            this._rsa = result.data.publicKey;
            await fs.writeFile(`${this._authDir}/token`, this._token)
            await fs.writeFile(`${this._authDir}/rsa`, this._rsa)
            this._onUpdate({Token: this._token, Key: this._rsa})
            this.watch();
            return result;
        } catch (err) {
            console.error('Unable to get token:', err);
        }
    }

    private async auth(clientId: string, proof: string) {
        if (!proof || !clientId) {
            throw new Error('Token manager is not set')
        }
        clearInterval(this.interval);
        await this.getToken(clientId, proof);
    }

    private watch() {
        this.interval = setInterval(() => {
            if (this._token && this._rsa) {
                jwt.verify(this._token, this._rsa, {algorithms: ['RS256']}, async (err: Error, decoded: any) => {
                    if (err) {
                        if (err.message === 'jwt expired') {
                            console.log('Refreshing JWT...')
                            await this.auth(this._clientId, this._proof)
                        } else {
                            console.error('Unable to verify token:', err.message)
                        }
                    } else {
                        const unixtime = Math.floor(+new Date() / 1000)
                        if (decoded.exp - unixtime <= 300) {
                            console.log('Refreshing JWT...')
                            await this.auth(this._clientId, this._proof)
                        }
                    }

                });
            }
        }, 60000)

    }

    set proof(proof: string) {
        this._proof = proof;
    }

    get publicKey() {
        return this._rsa;
    }

    get jwt() {
        return this._token;
    }
}
