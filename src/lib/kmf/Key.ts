import {PrismaClient} from "@prisma/client";
import {KeyData, KeyOptions} from "../../../index";

export default class Key {
    uuid: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    data?: any;

    private readonly _db: PrismaClient;

    constructor(options: KeyOptions, DB: PrismaClient) {
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

        this._db.keyStore.create({
            data: {
                uuid: uuid,
                active: isActive === 1,
                data: JSON.stringify(keyData)
            }
        }).then((row: any) => {
            console.log(`Successfully saved ${row.uuid} to the keyStore`);
        }).catch((e: Error) => {
            console.error('Unable to save to the keyStore:', e.message)
        });
    }

    load(type: 'privateKey' | 'publicKey'): Promise<string> {
        return new Promise((resolve, reject) => {
            let key: any;
            this._db.keyStore.findUnique({
                where: {
                    uuid: this.uuid
                }
            }).then((row: any) => {
                key = JSON.parse(row.data);
                resolve(key[type]);
                // resolve(this.uuid);
            }).catch(() => {
                reject('No key data found for ' + this.uuid)
            })
        })
    }

    destroy(): Promise<string> {
        return new Promise((resolve, reject) => {
            this._db.keyStore.delete({
                where: {
                    uuid: this.uuid
                }
            }).then(() => {
                resolve(this.uuid);
            }).catch(() => {
                reject('No key data found for ' + this.uuid)
            })
        })
    }
}
