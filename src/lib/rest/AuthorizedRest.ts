import Rest from "./Rest";
import {TokenManager} from "../TokenManager";
import {Zokrates} from "../zk/Zokrates";
import {AuthHeaders} from "../../../index";

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

class AuthorizedRest extends Rest {
    private tokenManager: TokenManager;
    private zk: Zokrates;
    readonly _clientId: string;
    readonly _authDir: string;

    constructor(base_url: string, clientId: string, zk: Zokrates, authDir: string) {
        super(base_url)
        this.zk = zk;
        this._clientId = clientId;
        this._authDir = authDir;
    }

    init() {
        return new Promise(async (resolve, reject) => {
            try {

                this.tokenManager = new TokenManager(this._clientId, {
                    proof: JSON.stringify(this.zk.generateProof()),
                    authDir: this._authDir,
                    onUpdate: this.updateRestHeaders
                })
                console.log('Token Manager created!')
                await this.tokenManager.init();
                this.updateRestHeaders({
                    Token: this.tokenManager.jwt,
                    Key: JSON.stringify(this.tokenManager.publicKey)
                });
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
        if (!this._headers.hasOwnProperty('Token') || !this._headers.hasOwnProperty('Key')) {
            try {
                const result = await this.tokenManager.getAuth(JSON.stringify(this.zk.generateProof()));
                this.updateRestHeaders({Token: result.data.token, Key: JSON.stringify(result.data.publicKey)})
            } catch (e) {
                throw new Error(e.message)
            }

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


}

export default AuthorizedRest
