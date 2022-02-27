import createEmitter from "./EventFactory";
import {TokenManagerOptions} from "../../index";
import Rest from "./rest/Rest";
import {AxiosResponse} from "axios";

const config = require('../../config.json')
const jwt = require('jsonwebtoken')
const fs = require('fs-extra');

const e = createEmitter();

export class TokenManager {

    private readonly _clientId: string;
    private readonly _onUpdate: Function;
    private readonly _authDir: string;
    private _proof: string;
    private _token: string;
    private _rsa: string;
    private interval: any;
    private _restClient: Rest;
    ready: boolean = false;

    constructor(clientId: string, options: TokenManagerOptions) {
        this._clientId = clientId;
        this._proof = options.proof;
        this._onUpdate = options.onUpdate;
        this._authDir = options.authDir;
        fs.ensureDirSync(this._authDir)
        this._restClient = new Rest(config.baseUrl);
        this.loadToken(this._clientId, this._proof);
        e.on('refreshToken', () => {
            this.auth(this._clientId, this._proof)
        });

    }

    async getAuth(proof: string) {
        return this.getToken(this._clientId, proof);
    }

    private loadToken(clientId: string, proof: string) {
        if (fs.existsSync(this._authDir + '/token') && fs.existsSync(this._authDir + '/rsa')) {
            const token = fs.readFileSync(this._authDir + '/token', 'utf8')
            const rsa = fs.readFileSync(this._authDir + '/rsa', 'utf8')

            jwt.verify(token, rsa, {algorithms: ['RS256']}, (err: Error, decoded: any) => {

                if (err) {
                    if (err.message === 'jwt expired') {
                        console.log('Refreshing JWT...')
                        e.emit('refreshToken')
                    } else {
                        console.error('Unable to verify token:', err.message)
                    }
                } else {
                    const unixtime = Math.floor(+new Date() / 1000)
                    if (decoded.exp - unixtime <= 300) {
                        e.emit('refreshToken')
                    } else {
                        this._token = token;
                        this._rsa = rsa;
                        this._onUpdate({Token: this._token, Key: this._rsa})
                        this.ready = true;
                    }
                }

            });
        } else {
            this.getToken(clientId, proof).then(() => {
                this.ready = true;
            })

        }
    }

    private async getToken(clientId: string, proof: string) {
        const result = await this._restClient.post('/auth', {uuid: clientId, proof: proof});
        this._token = result.data.token;
        this._rsa = result.data.publicKey;
        fs.writeFileSync(this._authDir + '/token', this._token)
        fs.writeFileSync(this._authDir + '/rsa', this._rsa)
        this._onUpdate({Token: this._token, Key: this._rsa})
        this.watch();
        return result;
    }

    private auth(clientId: string, proof: string) {
        if (!proof || !clientId) {
            throw new Error('Token manager is not set')
        }
        clearInterval(this.interval);
        this.getToken(clientId, proof);
    }


    private watch() {
        this.interval = setInterval(() => {
            if (this._token && this._rsa) {
                jwt.verify(this._token, this._rsa, {algorithms: ['RS256']}, function (err: Error, decoded: any) {

                    if (err) {
                        if (err.message === 'jwt expired') {
                            console.log('Refreshing JWT...')
                            e.emit('refreshToken')
                        } else {
                            console.error('Unable to verify token:', err.message)
                        }
                    } else {
                        const unixtime = Math.floor(+new Date() / 1000)
                        if (decoded.exp - unixtime <= 300) {
                            e.emit('refreshToken')
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
