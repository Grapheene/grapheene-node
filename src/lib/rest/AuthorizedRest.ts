import Rest from "./Rest";
import {TokenManager} from "../TokenManger";
import {Zokrates} from "../zk/Zokrates";
import {AuthHeaders} from "../../../index";

class AuthorizedRest extends Rest {
    private tokenManager: TokenManager;
    private zk: Zokrates;

    constructor(base_url: string, clientId: string, zk: Zokrates) {
        super(base_url)
        this.zk = zk;
        this.tokenManager = new TokenManager(clientId, {
            proof: JSON.stringify(this.zk.generateProof()),
            onUpdate: this.updateRestHeaders
        });
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
        return super.post(endpoint, params)
    }

    async put(endpoint: string, params?: any) {
        await this.ensureHeaders();
        return super.post(endpoint, params)
    }

    async del(endpoint: string) {
        await this.ensureHeaders();
        return super.post(endpoint)
    }


}

export default AuthorizedRest
