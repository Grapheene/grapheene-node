import AuthorizedRest from "./rest/AuthorizedRest";
import {Zokrates} from "./zk/Zokrates";
import {KMS} from "./kms/KMS";
import * as Crypto from './encryption'
import TypedArray = NodeJS.TypedArray;

const config = require('../../config.json')

const fs = require('fs-extra');
const path = require('path');
const defaults = {}


export class Grapheene {

    private readonly clientId: string;
    private readonly apiKey: string;
    private readonly filesDir: string;
    private readonly zkDir: string;
    private readonly cryptoDir: string;
    private readonly _restClient: AuthorizedRest;

    private _options: string;
    private _kms: KMS;
    private _zk: Zokrates;
    private _crypto: any;
    private _storage: any;
    private _data: any;
    private _keys: any;


    constructor(clientId: string, apiKey: string, opts?: any) {
        this._options = Object.assign({}, defaults, opts);
        this.apiKey = apiKey;
        this.clientId = clientId;

        this.crypto = Crypto;

        this.filesDir = path.dirname(require.main.filename || process.mainModule.filename) + '/files'

        if (!this.apiKey.startsWith('SK') || !this.apiKey) {
            throw new Error('Invalid APK Key')
        }

        if (!this.clientId.startsWith('US') || !this.clientId) {
            throw new Error('Invalid Client ID')
        }

        this.zkDir = this.filesDir + '/zk';
        this.cryptoDir = this.filesDir + '/encrypt';

        this.ensureDirExist()
        this.setupZK()
        this.setupTokenManager()
        this._restClient = new AuthorizedRest(config.baseUrl, this.clientId, this.zk);
        this.setupKMS()

    }

    private ensureDirExist() {
        fs.ensureDirSync(this.filesDir)
        fs.ensureDirSync(this.zkDir)
        fs.ensureDirSync(this.cryptoDir)
    }

    private setupZK() {
        this.zk = new Zokrates(this.clientId, this.apiKey, {path: this.zkDir});

    }

    private setupTokenManager() {

    }

    private setupKMS() {
        this.kms = new KMS(this._restClient);
    }

    private set zk(zk: Zokrates) {
        this._zk = zk;
    }

    save(filePath: string, data: string | TypedArray | DataView) {
        this.createDir(filePath);
        fs.writeFileSync(filePath, data)
    }

    private createDir(filePath: string) {
        const seperator = path.sep;
        let regEx = new RegExp(`(^${seperator}.+)(${seperator}.+$)`);
        const match = filePath.match(regEx)
        fs.ensureDirSync(match[1])
    }

    get zk() {
        return this._zk;
    }

    set kms(kms: KMS) {
        this._kms = kms;
    }

    get kms() {
        return this._kms;
    }

    private set crypto(crypto: any) {
        this._crypto = crypto;
    }

    get crypto() {
        return this._crypto;
    }

    private set storage(storage: KMS) {
        this._storage = storage;
    }

    get storage() {
        return this._storage;
    }

}
