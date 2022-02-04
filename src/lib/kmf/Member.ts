import Key from "./Key";
import {KeyData, MemberOptions} from "../../../index";
import {Database} from "sqlite3";
import * as encryption from "../encryption";

export default class Member {

    private readonly uniqueName: string;
    private readonly _db: Database;
    private readonly _master: Member;
    private readonly _keys: Array<Key> = [];
    private _activeKey: string;

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

    private async getKeys(): Promise<KeyData> {
        let privateKey, publicKey;
        try {
            privateKey= await this._master.keys[0].load('privateKey');
        } catch (e) {
            console.log("Unable to load master key");
            throw new Error(e.message)
        }
        try {
            publicKey = await this._keys[0].load('publicKey');
        } catch (e) {
            console.log("Unable to load member key "+this._keys[0].uuid);
            throw new Error(e.message)
        }

        return {
            privateKey: privateKey,
            publicKey: publicKey
        }
    }

    destroy(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                for (let x in this._keys) {
                    await this._keys[x].destroy()
                }
                resolve(this.uuid + ' Keys Destroyed')
            } catch (e) {
                reject(e)
            }

        });
    }

    async encrypt(data: any): Promise<string> {
        return encryption.encrypt(data, await this.getKeys())

    }

    async decrypt(encrypted: any): Promise<string> {
        return encryption.decrypt(encrypted, await this.getKeys())
    }

    get keys() {
        return this._keys;
    }

}
