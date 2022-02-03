import createEmitter from "./EventFactory";
import {TokenManagerOptions} from "../../index";
import Rest from "./rest/Rest";
import {AxiosResponse} from "axios";

const config = require('../../config.json')
const jwt = require('jsonwebtoken')

const e = createEmitter();

export class TokenManager {

    private readonly _clientId: string;
    private readonly _onUpdate: Function;
    private _proof: string;
    private _token: string;
    private _rsa: string;
    private interval: any;
    private _restClient: Rest;

    constructor(clientId: string, options: TokenManagerOptions) {
        this._clientId = clientId;
        this._proof = options.proof;
        this._onUpdate = options.onUpdate
        this._restClient = new Rest(config.baseUrl);
        this.getToken(this._clientId, this._proof);
        e.on('refreshToken', () => {
            this.auth(this._clientId, this._proof)
        });

    }

    async getAuth(proof: string){
        return await this._restClient.post('/auth', {uuid: this._clientId, proof: proof})
    }

    private getToken(clientId: string, proof: string) {
        this._restClient.post('/auth', {uuid: clientId, proof: proof})
            .then((result: AxiosResponse) => {
                this._token = result.data.token;
                this._rsa = result.data.publicKey;
                this._onUpdate({Token: this._token, Key: this._rsa})
                this.watch();
            }).catch((e: Error)=>{
                console.log(e.message)
        })
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
                        console.log(err)
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
