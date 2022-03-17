import Rest from "../rest/Rest";
import { KMF } from "../kmf/KMF";
import { StorageOptions } from "../../../index";
import KeyRingData from "../kmf/KeyRingData";
export declare class Storage {
    private _restClient;
    private _medium;
    private _kmf;
    constructor(options: StorageOptions, RestClient: Rest, Kmf: KMF);
    local(): this;
    cloud(): this;
    find(fileName: string): KeyRingData | null;
    list(): KeyRingData[];
    save(keyRingData: KeyRingData | any, options?: {
        path?: string;
        name?: string;
    }): Promise<unknown>;
    delete(ringData: KeyRingData): Promise<unknown>;
    download(ringData: KeyRingData, options: {
        path: string;
        name?: string;
    }): Promise<unknown>;
    get(ringData: KeyRingData, options: {
        path: string;
        name?: string;
    }): Promise<string>;
    private saveLocal;
    private saveCloud;
    private deleteCloud;
    private deleteLocal;
    private createDir;
    load(fileId: string): Promise<this>;
    set kmf(kmf: KMF);
    get kmf(): KMF;
}
