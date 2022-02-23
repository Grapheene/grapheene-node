"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = require("sqlite3");
const client_1 = require("@prisma/client");
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
        if (this._db instanceof sqlite3_1.Database) {
            this._db.get(`SELECT *
                          FROM keystore
                          WHERE uuid = '${uuid}'`, (err, row) => {
                if (err) {
                    console.log(err);
                }
                if (!row) {
                    if (this._db instanceof sqlite3_1.Database) {
                        this._db.run('INSERT INTO keystore VALUES (?, ?, ?)', [uuid, isActive, JSON.stringify(keyData)]);
                    }
                }
            });
        }
        if (this._db instanceof client_1.PrismaClient) {
            this._db.keyStore.create({
                data: {
                    uuid: uuid,
                    active: isActive === 1,
                    data: JSON.stringify(keyData)
                }
            }).then((row) => {
                console.log('Key ' + row.uuid + 'Saved in DB');
            }).catch((e) => {
                console.log(e.message);
            });
        }
    }
    load(type) {
        return new Promise((resolve, reject) => {
            let key;
            if (this._db instanceof sqlite3_1.Database) {
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
            }
            if (this._db instanceof client_1.PrismaClient) {
                this._db.keyStore.findUnique({
                    where: {
                        uuid: this.uuid
                    }
                }).then((row) => {
                    key = JSON.parse(row.data);
                    resolve(key[type]);
                    resolve(this.uuid);
                }).catch(() => {
                    reject('No key data found for ' + this.uuid);
                });
            }
        });
    }
    destroy() {
        return new Promise((resolve, reject) => {
            if (this._db instanceof sqlite3_1.Database) {
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
            }
            if (this._db instanceof client_1.PrismaClient) {
                this._db.keyStore.delete({
                    where: {
                        uuid: this.uuid
                    }
                }).then(() => {
                    resolve(this.uuid);
                }).catch(() => {
                    reject('No key data found for ' + this.uuid);
                });
            }
        });
    }
}
exports.default = Key;
//# sourceMappingURL=Key.js.map