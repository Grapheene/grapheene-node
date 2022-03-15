import Rest from "../rest/Rest";
import KeyRing from "./KeyRing";
import {PrismaClient} from "@prisma/client";

export class KMF {
    private readonly _restClient: Rest;
    private readonly _db: PrismaClient;

    private _ring: KeyRing;

    constructor(RestClient: Rest, DB: PrismaClient) {
        this._restClient = RestClient;
        this._db = DB;
        this.ring = new KeyRing(this._restClient, this._db);
    }

    async list() {
        try {
            const keyRingsRes = await this._restClient.get('/kmf/ring')
            if (keyRingsRes.status >= 200 && keyRingsRes.status < 300) {
                return keyRingsRes.data.keyRings
            } else {
                console.error('Unable to load keyRings from API')
            }
        } catch (e) {
            console.error('Unable to load keyRings:', e.message)
        }
    }

    set ring(keyRing) {
        this._ring = keyRing;
    }

    get ring() {
        return this._ring;
    }

    async destroy() {
        const result = await this._restClient.del('/kmf/ring/' + this._ring.uuid);
        this.ring = null;
        return result;
    }
}
