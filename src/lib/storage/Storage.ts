import Rest from "../rest/Rest";
import TypedArray = NodeJS.TypedArray;
import { KMF } from "../kmf/KMF";
import { KeyRingDataOptions, KeyRingDataRequest, StorageOptions } from "../../../index";
import KeyRingData from "../kmf/KeyRingData";
import { promises as fs, createReadStream } from 'fs';
import path from 'path';


export class Storage {

    private _restClient: Rest;
    private _medium: 'cloud' | 'local' | 'unsaved' = 'cloud';
    private _kmf: KMF

    constructor(options: StorageOptions, RestClient: Rest, Kmf: KMF) {
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

    find(fileName: string): KeyRingData | null {
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

    async save(keyRingData: KeyRingData | any, options?: { path?: string, name?: string }) {
        if (typeof options !== 'undefined' && options.name) {
            keyRingData.name = options.name;
        }
        let originPath = keyRingData.path;
        return new Promise(async (resolve, reject) => {
            try {
                if (this._medium === null) {
                    throw new Error('local() or cloud() medium must be selected')
                }

                if (this._medium === "local" && keyRingData.path === 'in:memory') {
                    if (typeof options === 'undefined' || !options.path) {
                        throw new Error("Filepath is required for data")
                    }
                    const sp = options.path.split(path.sep);
                    if (typeof options === 'undefined' || !options.name) {
                        // For data we write clear text to file then encrypt the file
                        const member = this._kmf.ring.members[0];
                        let data: any = await member.decrypt(keyRingData);
                        await this.saveLocal(options.path, sp[sp.length - 1], data.decrypted);
                        await member.file().encrypt(options.path);
                    }
                    resolve(await this._kmf.ring.updateData({
                        uuid: keyRingData.uuid,
                        path: options.path,
                        name: sp[sp.length - 1],
                        service: this._medium
                    }));
                }

                if (this._medium === "local" && originPath !== 'in:memory') {
                    let path;
                    if (keyRingData.service === 'cloud') {
                        path = await this.get(keyRingData, { path: options.path })
                        await this.deleteCloud(keyRingData.path)
                    }

                    resolve(await this._kmf.ring.updateData({
                        uuid: keyRingData.uuid,
                        path: path || options.path,
                        name: keyRingData.name,
                        service: this._medium
                    }));
                }

                if (this._medium === "cloud") {
                    if (originPath === 'in:memory') {

                        const sp = options.path.split(path.sep);
                        const member = this._kmf.ring.members[0];
                        keyRingData.path = originPath;
                        let data: any = await member.decrypt(keyRingData);
                        await this.saveLocal(options.path, sp[sp.length - 1], data.decrypted);
                        keyRingData = await member.file().encrypt(options.path);
                        keyRingData.service = 'local'
                    }
                    const cloudData = await this.saveCloud(keyRingData)
                    resolve(await this._kmf.ring.updateData({
                        uuid: keyRingData.uuid,
                        path: cloudData.id,
                        name: keyRingData.name,
                        service: this._medium
                    }));
                }
                this._medium = null;
            } catch (e) {
                this._medium = null;
                console.error('Unable to save keyring data:', e)
                reject(e)
            }
        })

    }

    delete(ringData: KeyRingData) {
        return new Promise(async (resolve, reject) => {
            try {
                await this._kmf.ring.delData(ringData.uuid);

                if (ringData.service === "local") {
                    await this.deleteLocal(ringData.path, ringData.name)
                }

                if (ringData.service === "cloud") {
                    await this.deleteCloud(ringData.uuid)
                }
                resolve(true);
            } catch (e) {
                reject(e)
            }
        })

    }

    download(ringData: KeyRingData, options: { path: string, name?: string }) {


        return new Promise(async (resolve, reject) => {
            try {
                if (!options.hasOwnProperty('path')) {
                    throw new Error('Local path for downloading cloud data must be defined')
                }
                let name = options.name || ringData.name
                let filePath = options.path
                const savedPath = await this._restClient.download('/file/' + ringData.uuid, { path: filePath })
                resolve(await this._kmf.ring.updateData({
                    uuid: ringData.uuid,
                    path: savedPath,
                    name: name,
                    service: 'local'
                }));
            } catch (e) {
                reject(e)
            }
        })
    }

    get(ringData: KeyRingData, options: { path: string, name?: string }): Promise<string> {


        return new Promise(async (resolve, reject) => {
            try {
                if (!options.hasOwnProperty('path')) {
                    throw new Error('Local path for downloading cloud data must be defined')
                }
                let filePath = options.path
                const savedPath = await this._restClient.download('/file/' + ringData.path, { path: filePath })
                resolve(savedPath)
            } catch (e) {
                reject(e)
            }
        })
    }

    private saveLocal(filePath: string, fileName: string, data: string | TypedArray | DataView) {
        return new Promise(async (resolve, reject) => {
            try {
                filePath = filePath.replace(path.sep + fileName, '')
                await fs.mkdir(filePath, { recursive: true })
                await fs.writeFile(filePath + path.sep + fileName, data, { encoding: 'utf8' });
                resolve(true)
            } catch (e) {
                reject(e)
            }
        })
    }

    private saveCloud(keyRingData: KeyRingData): Promise<{ id: string }> {
        return new Promise(async (resolve, reject) => {
            try {
                let savePath = keyRingData.path;
                const stats = await fs.stat(savePath);
                const params = {
                    file: createReadStream(savePath),
                    size: stats.size
                }

                const result = await this._restClient.multiPartForm('/upload', params)
                await fs.unlink(savePath);
                resolve(result.data);
            } catch (e) {
                reject(e)
            }

        })
    }

    private deleteCloud(fileId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                await this._restClient.del('/file/' + fileId);
            } catch (e) {
                reject(e)
            }

        })
    }

    private deleteLocal(filePath: string, fileName: string) {
        return new Promise(async (resolve, reject) => {
            try {
                await fs.unlink(filePath + path.sep + fileName)
                resolve(true)
            } catch (e) {
                reject(e)
            }

        })
    }

    private async createDir(filePath: string) {
        await fs.mkdir(filePath, { recursive: true })
    }

    async load(fileId: string) {
        return this;
    }

    set kmf(kmf: KMF) {
        this._kmf = kmf;
    }

    get kmf() {
        return this._kmf;
    }


}
