import Key from "./Key";
import { KeyRingDataRequest, MemberOptions } from "../../../index";
import KeyRing from "./KeyRing";
import KeyRingData from "./KeyRingData";
import { PrismaClient } from "@prisma/client";
export default class Member {
    private readonly uniqueName;
    private readonly _db;
    private readonly _master;
    private readonly _keys;
    private _mode;
    private _save;
    private _delete;
    private _keyRing;
    uuid: string;
    name: string;
    constructor(options: MemberOptions, DB: PrismaClient, keyRing: KeyRing, master?: Member);
    private getKeys;
    destroy(): Promise<string>;
    data(): this;
    file(): this;
    encrypt(dataOrFilePath: any, name?: string): Promise<KeyRingData | KeyRingDataRequest>;
    decrypt(keyRingData: KeyRingData, path?: string): Promise<KeyRingData | KeyRingDataRequest | string>;
    decryptByDataObject(keyRingData: KeyRingData, path?: string): Promise<KeyRingData | KeyRingDataRequest>;
    decryptByMode(keyRingData: KeyRingData | KeyRingDataRequest): Promise<KeyRingData | KeyRingDataRequest>;
    get keys(): Key[];
    get save(): Function;
    get delete(): Function;
    set save(save: Function);
    set delete(del: Function);
}
