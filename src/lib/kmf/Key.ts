import {KeyData, KeyOptions} from "../../../index";
import {Database} from "sqlite3";


export default class Key {
    uuid: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    data?: any;
    private readonly _db: Database;

    constructor(options: KeyOptions, DB: Database) {
        this.uuid = options.uuid;
        this.active = options.active;
        this.createdAt = options.createdAt;
        this.updatedAt = options.updatedAt;
        this._db = DB;

        if (options.hasOwnProperty('data')) {
            this.save(this.uuid, this.active, options.data)
        }
    }

    private save(uuid: string, active: boolean, keyData: KeyData) {
        const isActive = active ? 1 : 0

        this._db.get(`SELECT *
                      FROM keystore
                      WHERE uuid = '${uuid}'`, (err, row) => {
            if (err) {
                console.log(err)
            }
            if (!row) {
                this._db.run('INSERT INTO keystore VALUES (?, ?, ?)', [uuid, isActive, JSON.stringify(keyData)]);
            }
        });
    }

    load(type: 'privateKey' | 'publicKey'): Promise<string> {
        return new Promise((resolve, reject) => {
            let key: any;
            this._db.get(`SELECT *
                          FROM keystore
                          WHERE uuid = '${this.uuid}'`, (err, row) => {
                if (row) {
                    key = JSON.parse(row.data);
                    resolve(key[type]);
                } else {
                    reject('No key data found for ' + this.uuid)
                }
            });
        })

    }

    destroy(): Promise<string> {
        return new Promise((resolve, reject) => {
            this._db.run(`DELETE
                          FROM keystore
                          WHERE uuid = ?`, [this.uuid], (err: Error, row: any) => {
                if (err) {
                    reject('No key data found for ' + this.uuid)
                } else {
                    resolve(this.uuid);

                }
            });
        })

    }

}
