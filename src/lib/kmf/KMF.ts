import Rest from "../rest/Rest";
import KeyRing from "./KeyRing";
import {Database} from "sqlite3";


export class KMF {

    private readonly _restClient: Rest;
    private readonly _db: Database;

    private _ring: KeyRing;

    constructor(RestClient: Rest, DB: Database) {
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
