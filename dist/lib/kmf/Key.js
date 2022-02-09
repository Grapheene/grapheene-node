"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Key {
    constructor(options, DB) {
        this.uuid = options.uuid;
        this.active = options.active;
        this.createdAt = options.createdAt;
        this.updatedAt = options.updatedAt;
        this._db = DB;
        if (options.hasOwnProperty('data')) {
            this.save(this.uuid, this.active, options.data);
        }
    }
    save(uuid, active, keyData) {
        const isActive = active ? 1 : 0;
        this._db.get(`SELECT *
                      FROM keystore
                      WHERE uuid = '${uuid}'`, (err, row) => {
            if (err) {
                console.log(err);
            }
            if (!row) {
                this._db.run('INSERT INTO keystore VALUES (?, ?, ?)', [uuid, isActive, JSON.stringify(keyData)]);
            }
        });
    }
    load(type) {
        return new Promise((resolve, reject) => {
            let key;
            this._db.get(`SELECT *
                          FROM keystore
                          WHERE uuid = '${this.uuid}'`, (err, row) => {
                if (row) {
                    key = JSON.parse(row.data);
                    resolve(key[type]);
                }
                else {
                    reject('No key data found for ' + this.uuid);
                }
            });
        });
    }
    destroy() {
        return new Promise((resolve, reject) => {
            this._db.run(`DELETE
                          FROM keystore
                          WHERE uuid = ?`, [this.uuid], (err, row) => {
                if (err) {
                    reject('No key data found for ' + this.uuid);
                }
                else {
                    resolve(this.uuid);
                }
            });
        });
    }
}
exports.default = Key;
//# sourceMappingURL=Key.js.map