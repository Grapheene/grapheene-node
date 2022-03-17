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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Storage = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
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
            let originPath = keyRingData.path;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (this._medium === null) {
                        throw new Error('local() or cloud() medium must be selected');
                    }
                    if (this._medium === "local" && keyRingData.path === 'in:memory') {
                        if (typeof options === 'undefined' || !options.path) {
                            throw new Error("Filepath is required for data");
                        }
                        const sp = options.path.split(path_1.default.sep);
                        if (typeof options === 'undefined' || !options.name) {
                            // For data we write clear text to file then encrypt the file
                            const member = this._kmf.ring.members[0];
                            let data = yield member.decrypt(keyRingData);
                            yield this.saveLocal(options.path, sp[sp.length - 1], data.decrypted);
                            yield member.file().encrypt(options.path);
                        }
                        resolve(yield this._kmf.ring.updateData({
                            uuid: keyRingData.uuid,
                            path: options.path,
                            name: sp[sp.length - 1],
                            service: this._medium
                        }));
                    }
                    if (this._medium === "local" && originPath !== 'in:memory') {
                        let path;
                        if (keyRingData.service === 'cloud') {
                            path = yield this.get(keyRingData, { path: options.path });
                            yield this.deleteCloud(keyRingData.path);
                        }
                        resolve(yield this._kmf.ring.updateData({
                            uuid: keyRingData.uuid,
                            path: path || options.path,
                            name: keyRingData.name,
                            service: this._medium
                        }));
                    }
                    if (this._medium === "cloud") {
                        if (originPath === 'in:memory') {
                            const sp = options.path.split(path_1.default.sep);
                            const member = this._kmf.ring.members[0];
                            keyRingData.path = originPath;
                            let data = yield member.decrypt(keyRingData);
                            yield this.saveLocal(options.path, sp[sp.length - 1], data.decrypted);
                            keyRingData = yield member.file().encrypt(options.path);
                            keyRingData.service = 'local';
                        }
                        const cloudData = yield this.saveCloud(keyRingData);
                        resolve(yield this._kmf.ring.updateData({
                            uuid: keyRingData.uuid,
                            path: cloudData.id,
                            name: keyRingData.name,
                            service: this._medium
                        }));
                    }
                    this._medium = null;
                }
                catch (e) {
                    this._medium = null;
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
                    yield this.deleteCloud(ringData.uuid);
                }
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    download(ringData, options) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!options.hasOwnProperty('path')) {
                    throw new Error('Local path for downloading cloud data must be defined');
                }
                let name = options.name || ringData.name;
                let filePath = options.path;
                const savedPath = yield this._restClient.download('/file/' + ringData.uuid, { path: filePath });
                resolve(yield this._kmf.ring.updateData({
                    uuid: ringData.uuid,
                    path: savedPath,
                    name: name,
                    service: 'local'
                }));
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    get(ringData, options) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!options.hasOwnProperty('path')) {
                    throw new Error('Local path for downloading cloud data must be defined');
                }
                let filePath = options.path;
                const savedPath = yield this._restClient.download('/file/' + ringData.path, { path: filePath });
                resolve(savedPath);
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    saveLocal(filePath, fileName, data) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                filePath = filePath.replace(path_1.default.sep + fileName, '');
                yield fs_1.promises.mkdir(filePath, { recursive: true });
                yield fs_1.promises.writeFile(filePath + path_1.default.sep + fileName, data, { encoding: 'utf8' });
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
                let savePath = keyRingData.path;
                const stats = yield fs_1.promises.stat(savePath);
                const params = {
                    file: (0, fs_1.createReadStream)(savePath),
                    size: stats.size
                };
                const result = yield this._restClient.multiPartForm('/upload', params);
                yield fs_1.promises.unlink(savePath);
                resolve(result.data);
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    deleteCloud(fileId) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._restClient.del('/file/' + fileId);
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    deleteLocal(filePath, fileName) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs_1.promises.unlink(filePath + path_1.default.sep + fileName);
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    createDir(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs_1.promises.mkdir(filePath, { recursive: true });
        });
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