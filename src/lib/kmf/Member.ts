import Key from "./Key";
import {KeyData, KeyRingDataRequest, MemberOptions} from "../../../index";
import {Database} from "sqlite3";
import * as encryption from "../encryption";
import KeyRing from "./KeyRing";
import KeyRingData from "./KeyRingData";
import {PrismaClient} from "@prisma/client";

const path = require("path")

export default class Member {

    private readonly uniqueName: string;
    private readonly _db: Database | PrismaClient;
    private readonly _master: Member;
    private readonly _keys: Array<Key> = [];
    private _mode: null | 'file' | 'data' | 'stream' = null;
    private _save: Function;
    private _delete: Function;
    private _keyRing: KeyRing;


    uuid: string;
    name: string;


    constructor(options: MemberOptions, DB: Database | PrismaClient, keyRing: KeyRing, master?: Member) {
        this.uuid = options.uuid;
        this.name = options.name;
        this._keyRing = keyRing;
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
            privateKey = await this._master.keys[0].load('privateKey');
        } catch (e) {
            console.log("Unable to load master key");
            throw new Error(e.message)
        }
        try {
            publicKey = await this._keys[0].load('publicKey');
        } catch (e) {
            console.log(e)
            console.log("Unable to load member key " + this._keys[0].uuid);
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

    data() {
        this._mode = 'data'
        return this;
    }

    file() {
        this._mode = 'file'
        return this;
    }

    encrypt(dataOrFilePath: any, name?: string): Promise<KeyRingData | KeyRingDataRequest> {
        return new Promise(async (resolve, reject) => {
            if (this._mode === null) {
                throw new Error("encrypt must be used with file() or data()")
            }

            if (this._mode === 'data') {
                if (typeof name === "undefined") {
                    throw new Error("name is required for data mode")
                } else {
                    const keyRingData: KeyRingDataRequest = {
                        name: name,
                        path: 'in:memory',
                        encrypted: await encryption.encrypt(dataOrFilePath, await this.getKeys()),
                        service: 'unsaved'
                    }
                    await this._keyRing.addData(keyRingData)
                    resolve(keyRingData);
                }

            }

            if (this._mode === 'file') {
                const sp = dataOrFilePath.split(path.sep);
                const keyRingData: KeyRingDataRequest = {
                    name: typeof name === 'undefined' ? sp[sp.length - 1] : name,
                    path: dataOrFilePath,
                    service: 'local'
                }
                await encryption.encryptFile(dataOrFilePath, await this.getKeys());
                resolve(await this._keyRing.addData(keyRingData));
            }
        })

    }

    async decrypt(keyRingData: KeyRingData | KeyRingDataRequest): Promise< KeyRingData | KeyRingDataRequest > {
        return new Promise(async (resolve, reject) => {
            if (this._mode === null) {
                reject("decrypt must be used with file() or data()")
            }
            if (this._mode === 'data') {
                if (!keyRingData.encrypted) {
                    reject("encrypted is required for data mode")
                }
                const result: KeyRingDataRequest = {
                    ...keyRingData,
                    decrypted: await encryption.decrypt(keyRingData.encrypted, await this.getKeys()),
                }

                resolve(result)
            }

            if (this._mode === 'file') {
                await encryption.decryptFile(keyRingData.path, await this.getKeys());
                resolve(keyRingData)
            }
        })
    }

    get keys() {
        return this._keys;
    }

    get save() {
        return this._save;
    }

    get delete() {
        return this._delete;
    }

    set save(save: Function) {
        this._save = save;
    }

    set delete(del: Function) {
        this._delete = del;
    }

}
