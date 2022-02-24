"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Storage = void 0;
const fs = require('fs-extra');
const path = require('path');
class Storage {
    constructor(options, RestClient, Kmf) {
        this._medium = 'cloud';
        this._restClient = RestClient;
        this._kmf = Kmf;
        this._medium = options.medium;
    }
    local() {
        this._medium = 'local';
        return this;
    }
    cloud() {
        this._medium = 'cloud';
        return this;
    }
    find(fileName) {
        for (let x in this._kmf.ring.data) {
            if (this._kmf.ring.data[x].name === fileName) {
                return this._kmf.ring.data[x];
            }
        }
        return null;
    }
    list() {
        return this._kmf.ring.data;
    }
    save(keyRingData, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options !== 'undefined' && options.name) {
                keyRingData.name = options.name;
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (this._medium === "local" && keyRingData.path === 'in:memory') {
                        if (typeof options === 'undefined' || !options.path) {
                            reject("filepath is required for data");
                        }
                        const sp = options.path.split(path.sep);
                        if (typeof options === 'undefined' || !options.name) {
                            yield this.saveLocal(options.path, sp[sp.length - 1], keyRingData.encrypted);
                        }
                        resolve(yield this._kmf.ring.updateData({ uuid: keyRingData.uuid, path: options.path, name: sp[sp.length - 1], service: this._medium }));
                    }
                    if (typeof options !== 'undefined' && options.path) {
                        keyRingData.path = options.path;
                    }
                    if (this._medium === "local" && keyRingData.path === 'local') {
                        resolve(yield this._kmf.ring.updateData({ uuid: keyRingData.uuid, path: keyRingData.path, name: keyRingData.name, service: this._medium }));
                    }
                    if (this._medium === "cloud") {
                        yield this.saveCloud(keyRingData);
                        resolve(yield this._kmf.ring.updateData({ uuid: keyRingData.uuid, path: keyRingData.path, name: keyRingData.name, service: this._medium }));
                    }
                }
                catch (e) {
                    console.error('Unable to save keyring data:', e);
                    reject(e);
                }
            }));
        });
    }
    delete(ringData) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._kmf.ring.delData(ringData.uuid);
                if (ringData.service === "local") {
                    yield this.deleteLocal(ringData.path, ringData.name);
                }
                if (ringData.service === "cloud") {
                    // await this.deleteCloud(filePath, data)
                }
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    saveLocal(filePath, fileName, data) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                fs.ensureDirSync(filePath);
                fs.writeFileSync(filePath + path.sep + fileName, data);
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    saveCloud(keyRingData) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = fs.statSync(keyRingData.path);
                const params = {
                    file: fs.createReadStream(keyRingData.path),
                    size: stats.size
                };
                yield this._restClient.multiPartForm('/upload', params);
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    deleteCloud(fileId) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._restClient.del('/files/' + fileId);
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    deleteLocal(filePath, fileName) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                fs.unlinkSync(filePath + path.sep + fileName);
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    createDir(filePath) {
        fs.ensureDirSync(filePath);
    }
    load(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this;
        });
    }
    set kmf(kmf) {
        this._kmf = kmf;
    }
    get kmf() {
        return this._kmf;
    }
}
exports.Storage = Storage;
//# sourceMappingURL=Storage.js.map