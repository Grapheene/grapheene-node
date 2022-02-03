import {KeyData, KeyDataEnum, KeyOptions} from "../../../index";
import {Database} from "sqlite3";


export default class Key {
    uuid: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
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
        let stmt = this._db.prepare(`INSERT INTO keystore
                                     VALUES (?, ?, ?)`);
        stmt.run(uuid, active ? 1 : 0, keyData);
        stmt.finalize();

        this._db.each(`SELECT *
                       FROM keystore
                       WHERE uuid = ${uuid}`, function (err, row) {
            console.log(row.id + ': ' + row.uuid);
        });
    }

    load(type: KeyDataEnum) {
        let key: KeyData;
        this._db.get(`SELECT *
                      FROM keystore
                      WHERE uuid = ${this.uuid}`, (err, row) => {
            key = JSON.parse(row.data);
        });
        return key[type];
    }

}
