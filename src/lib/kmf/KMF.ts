import Rest from "../rest/Rest";
import KeyRing from "./KeyRing";
import {Database} from "sqlite3";
import {PrismaClient} from "@prisma/client";


export class KMF {

    private readonly _restClient: Rest;
    private readonly _db: Database | PrismaClient;

    private _ring: KeyRing;

    constructor(RestClient: Rest, DB: Database | PrismaClient) {
        this._restClient = RestClient;
        this._db = DB;
        this.ring = new KeyRing(this._restClient, this._db);
    }

    set ring (keyRing) {
        this._ring = keyRing;
    }

    get ring (){
        return this._ring;
    }
}
