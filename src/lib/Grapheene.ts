import {PrismaClient} from "@prisma/client";
import AuthorizedRest from "./rest/AuthorizedRest";
import {Zokrates} from "./zk/Zokrates";
import {KMF} from "./kmf/KMF";
import {Storage} from "./storage/Storage";
import {DatabaseGenerator} from './DatabaseGenerator';
import {GrapheeneOptions} from "../../index";
import Rest from "./rest/Rest";

const fs = require('fs-extra');
const path = require('path');
const config = require('../../config.json')
const node_modules = `${__dirname}${path.sep}node_modules`;
const defaults = {
    medium: 'local',
    dir: './',
    db: {
        migrate: false
    }
}

if (fs.existsSync(node_modules + '/.prisma/client/package.json')) {
    fs.unlinkSync(node_modules + '/.prisma/client/package.json')
}
if (fs.existsSync(node_modules + '/.prisma/client/schema.prisma')) {
    fs.unlinkSync(node_modules + '/.prisma/client/schema.prisma')
}


export class Grapheene {

    private readonly clientId: string;
    private readonly apiKey: string;
    private readonly token: string;
    private readonly filesDir: string;
    private readonly zkDir: string;
    private readonly cryptoDir: string;
    private readonly dbDir: string;
    private readonly authDir: string;
    private readonly prismaDir: string;
    private _restClient: AuthorizedRest;

    private _db: any;
    private _options: GrapheeneOptions;
    private _kmf: KMF;
    private _zk: Zokrates;
    private _storage: any;

    constructor(clientId: string, apiKey: string, token: string, opts?: GrapheeneOptions) {
        this._options = Object.assign({}, defaults, opts);
        this.apiKey = apiKey;
        this.clientId = clientId;
        this.token = token;

        this.filesDir = path.dirname(__dirname) + path.sep + this.clientId + path.sep + 'files'
        this.prismaDir = path.dirname(__dirname).replace(/(dist.*)/, 'prisma')
        /*
        if (!this.apiKey.startsWith('SK') || !this.apiKey) {
            throw new Error('Invalid APK Key')
        }

        if (!this.clientId.startsWith('US') || !this.clientId) {
            throw new Error('Invalid Client ID')
        }

         */

        this.zkDir = this.filesDir + path.sep + 'zk';
        this.cryptoDir = this.filesDir + path.sep + 'encrypt';
        this.dbDir = this.filesDir + path.sep + 'db';
        this.authDir = this.filesDir + path.sep + 'auth';

        this.ensureDirExist()
    }

    private ensureDirExist() {
        fs.ensureDirSync(this.filesDir)
        fs.ensureDirSync(this.zkDir)
        fs.ensureDirSync(this.cryptoDir)
        fs.ensureDirSync(this.dbDir)
        fs.ensureDirSync(this.authDir)
    }

    async setup() {
        try {
            this.zk = new Zokrates(this.clientId, this.apiKey, this.token, {
                path: this.zkDir,
                rest: new Rest(config.baseUrl)
            });
            await this.zk.setup();
            this._restClient = new AuthorizedRest(config.baseUrl, this.clientId, this.zk, this.authDir);
            await this.setupDb()
            this.setupKMS()
            this.setupStorage()
            this._kmf.ring.storage = this._storage;
            return true;
        } catch (e) {
            console.error('Unable to setup Grapheene:', e);
            return false;
        }
    }

    private async setupDb() {
        this._db = await DatabaseGenerator({...this._options, dir: this.dbDir}) as PrismaClient;
    }

    private setupKMS() {
        this.kmf = new KMF(this._restClient, this._db);
    }

    private setupStorage() {
        this.storage = new Storage({medium: this._options.medium}, this._restClient, this._kmf)
    }

    private set zk(zk: Zokrates) {
        this._zk = zk;
    }

    get zk() {
        return this._zk;
    }

    set kmf(kmf: KMF) {
        this._kmf = kmf;
    }

    get kmf() {
        return this._kmf;
    }

    set storage(storage: Storage) {
        this._storage = storage;
    }

    get storage() {
        return this._storage;
    }
}
