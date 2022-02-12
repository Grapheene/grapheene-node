import {KeyData, KeyOptions} from "../../../index";
import {Database} from "sqlite3";
import {PrismaClient} from "@prisma/client";


export default class Key {
    uuid: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    data?: any;
    private readonly _db: Database | PrismaClient;

    constructor(options: KeyOptions, DB: Database | PrismaClient) {
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

        if (this._db instanceof Database) {
            this._db.get(`SELECT *
                          FROM keystore
                          WHERE uuid = '${uuid}'`, (err, row) => {
                if (err) {
                    console.log(err)
                }
                if (!row) {
                    if (this._db instanceof Database) {
                        this._db.run('INSERT INTO keystore VALUES (?, ?, ?)', [uuid, isActive, JSON.stringify(keyData)]);
                    }
                }
            });
        }

        if (this._db instanceof PrismaClient) {
            this._db.keyStore.create({
                data: {
                    uuid: uuid,
                    active: isActive === 1,
                    data: JSON.stringify(keyData)
                }
            }).then((row) => {
                console.log('Key '+row.uuid+'Saved in DB');
            }).catch((e)=>{
                console.log(e)
            });
        }
    }

    load(type: 'privateKey' | 'publicKey'): Promise<string> {
        return new Promise((resolve, reject) => {
            let key: any;
            if (this._db instanceof Database) {
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
            }

            if (this._db instanceof PrismaClient) {
                this._db.keyStore.findUnique({
                    where: {
                        uuid: this.uuid
                    }
                }).then((row: any) => {
                    key = JSON.parse(row.data);
                    resolve(key[type]);
                    resolve(this.uuid);
                }).catch(() => {
                    reject('No key data found for ' + this.uuid)
                })
            }
        })

    }

    destroy(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this._db instanceof Database) {
                this._db.run(`DELETE
                              FROM keystore
                              WHERE uuid = ?`, [this.uuid], (err: Error, row: any) => {
                    if (err) {
                        reject('No key data found for ' + this.uuid)
                    } else {
                        resolve(this.uuid);

                    }
                });
            }
            if (this._db instanceof PrismaClient) {
                this._db.keyStore.delete({
                    where: {
                        uuid: this.uuid
                    }
                }).then(() => {
                    resolve(this.uuid);
                }).catch(() => {
                    reject('No key data found for ' + this.uuid)
                })
            }

        })

    }

}
