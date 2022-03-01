import createEmitter from "./EventFactory";
import {TokenManagerOptions} from "../../index";
import Rest from "./rest/Rest";
import {constants as fsConstants, promises as fs} from 'fs';

const config = require('../../config.json')
const jwt = require('jsonwebtoken')

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
    ready: boolean = false

    constructor(clientId: string, options: TokenManagerOptions) {
        this._clientId = clientId;
        this._proof = options.proof;
        this._onUpdate = options.onUpdate;
        this._authDir = options.authDir;

        e.on('refreshToken', () => {
            this.auth(this._clientId, this._proof)
        });

        return (async () => {
            try {
                await fs.mkdir(this._authDir, {recursive: true})
                this._restClient = new Rest(config.baseUrl);
                await this.loadToken(this._clientId, this._proof);
                return this
            } catch (err) {
                console.error('Unable to create TokenManager authDir:', err);
                return false
            }
        })() as unknown as TokenManager;
    }

    async getAuth(proof: string) {
        return this.getToken(this._clientId, proof);
    }

    private async loadToken(clientId: string, proof: string) {
        try {
            const tokenFile = `${this._authDir}/token`
            const rsaFile = `${this._authDir}/rsa`

            await fs.access(tokenFile, fsConstants.F_OK)
            await fs.access(rsaFile, fsConstants.F_OK)

            const token = await fs.readFile(tokenFile, 'utf8')
            const rsa = await fs.readFile(rsaFile, 'utf8')

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
        } catch (e) {
            // ignore error

            this.getToken(clientId, proof).then(() => {
                this.ready = true
            })
        }
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
