import Rest from "../rest/Rest";
import TypedArray = NodeJS.TypedArray;
import {KMF} from "../kmf/KMF";
import {KeyRingDataOptions, KeyRingDataRequest, StorageOptions} from "../../../index";
import KeyRingData from "../kmf/KeyRingData";
import {promises as fs} from 'fs';
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

    async save(keyRingData: KeyRingData, options?:{path?: string, name?: string}) {
        if(typeof options !== 'undefined' && options.name){
            keyRingData.name = options.name;
        }
        return new Promise(async (resolve, reject) => {
            try {
                if (this._medium === "local" && keyRingData.path === 'in:memory') {
                    if (typeof options === 'undefined' || !options.path) {
                        reject("filepath is required for data")
                    }
                    const sp = options.path.split(path.sep);
                    if(typeof options === 'undefined' || !options.name){

                        await this.saveLocal(options.path, sp[sp.length - 1], keyRingData.encrypted)
                    }
                    resolve(await this._kmf.ring.updateData({uuid: keyRingData.uuid,path: options.path, name: sp[sp.length - 1], service: this._medium}));

                }

                if(typeof options !== 'undefined' && options.path){
                    keyRingData.path = options.path;
                }

                if (this._medium === "local" && keyRingData.path === 'local') {
                    resolve(await this._kmf.ring.updateData({uuid: keyRingData.uuid,path: keyRingData.path, name: keyRingData.name, service: this._medium}));
                }

                if (this._medium === "cloud") {
                    await this.saveCloud(keyRingData)
                    resolve(await this._kmf.ring.updateData({uuid: keyRingData.uuid,path: keyRingData.path, name: keyRingData.name, service: this._medium}));
                }
            } catch (e) {
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
                    // await this.deleteCloud(filePath, data)
                }
                resolve(true);
            } catch (e) {
                reject(e)
            }
        })

    }

    private saveLocal(filePath: string, fileName: string, data: string | TypedArray | DataView) {
        return new Promise(async (resolve, reject) => {
            try {
                await fs.mkdir(filePath, {recursive: true})
                await fs.writeFile(filePath + path.sep + fileName, data);
                // fs.ensureDirSync(filePath)
                // fs.writeFileSync(filePath + path.sep + fileName, data)
                resolve(true)
            } catch (e) {
                reject(e)
            }
        })
    }

    private saveCloud(keyRingData: KeyRingData) {

        return new Promise(async (resolve, reject) => {
            try {
                const stats = await fs.stat(keyRingData.path);
                const fd = await fs.open(keyRingData.path, 'r')
                const params = {
                    file: fd.createReadStream(),
                    // file: fs.createReadStream(keyRingData.path),
                    size: stats.size
                }

                await this._restClient.multiPartForm('/upload', params)
                resolve(true);
            } catch (e) {
                reject(e)
            }

        })
    }

    private deleteCloud(fileId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                await this._restClient.del('/files/' + fileId);
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
        await fs.mkdir(filePath, {recursive:true})
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
