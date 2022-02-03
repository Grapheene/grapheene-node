import Key from "./Key";
import {KeyData, KeyDataEnum, MemberOptions} from "../../../index";
import {Database} from "sqlite3";
import * as encryption from "../encryption";

export default class Member {

    private readonly uniqueName: string;
    private readonly _db: Database;
    private readonly _master: Member;
    private readonly _keys: Array<Key> = [];

    uuid: string;
    name: string;


    constructor(options: MemberOptions, DB: Database, master?: Member) {
        this.uuid = options.uuid;
        this.name = options.name;
        this._db = DB;
        if (master) {
            this._master = master;
        }
        this.uniqueName = options.uuid + ':' + options.name
        for (let x in options.keys) {
            this._keys.push(new Key(options.keys[x], this._db))
        }

    }

    private getKeys(): KeyData {
        return {
            privateKey: this._master._keys[0].load(KeyDataEnum.privateKey),
            publicKey: this._keys[0].load(KeyDataEnum.publicKey)
        }
    }

    encrypt(data: any): Promise<string> {
        return encryption.encrypt(data, this.getKeys())

    }

    decrypt(encrypted: any): Promise<string> {
        return encryption.encrypt(encrypted, this.getKeys())
    }

}
