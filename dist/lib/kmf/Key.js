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
        this._db.keyStore.create({
            data: {
                uuid: uuid,
                active: isActive === 1,
                data: JSON.stringify(keyData)
            }
        }).then((row) => {
            console.log(`Successfully saved ${row.uuid} to the keyStore`);
        }).catch((e) => {
            console.error('Unable to save to the keyStore:', e.message);
        });
    }
    load(type) {
        return new Promise((resolve, reject) => {
            let key;
            this._db.keyStore.findUnique({
                where: {
                    uuid: this.uuid
                }
            }).then((row) => {
                key = JSON.parse(row.data);
                resolve(key[type]);
                // resolve(this.uuid);
            }).catch(() => {
                reject('No key data found for ' + this.uuid);
            });
        });
    }
    destroy() {
        return new Promise((resolve, reject) => {
            this._db.keyStore.delete({
                where: {
                    uuid: this.uuid
                }
            }).then(() => {
                resolve(this.uuid);
            }).catch(() => {
                reject('No key data found for ' + this.uuid);
            });
        });
    }
}
exports.default = Key;
//# sourceMappingURL=Key.js.map