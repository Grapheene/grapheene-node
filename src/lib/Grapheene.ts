import {PrismaClient} from "@prisma/client";
import AuthorizedRest from "./rest/AuthorizedRest";
import {Zokrates} from "./zk/Zokrates";
import {KMF} from "./kmf/KMF";
import {Storage} from "./storage/Storage";
import {DatabaseGenerator} from './DatabaseGenerator';
import {GrapheeneOptions} from "../../index";
import Rest from "./rest/Rest";
import {constants as fsConstants, promises as fs} from 'fs';
import path from 'path';
import {prismaClient} from './shared/Paths'

const config = require('../../config.json')
const defaults = {
    medium: 'local',
    dir: './',
    projectDir: '.grapheene',
    db: {
        migrate: false
    },
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
    private readonly _options: GrapheeneOptions;
    private _restClient: AuthorizedRest;

    private _db: any;
    private _kmf: KMF;
    private _zk: Zokrates;
    private _storage: any;

    constructor(clientId: string, apiKey: string, token: string, opts?: any) {
        this._options = Object.assign({}, defaults, opts);
        this.apiKey = apiKey;
        this.clientId = clientId;
        this.token = token;

        this.filesDir = process.cwd() + path.sep + this._options.projectDir + path.sep + this.clientId + path.sep + 'files'
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
    }

    private async ensureDirExist() {
        try {
            const isNewProject = await fs.mkdir(this.filesDir, {recursive: true})
            if (isNewProject) {
                console.log(`It looks like you have created a new project! Be sure to add "${this._options.projectDir}" to your .gitignore`)
            }

            await fs.mkdir(this.zkDir, {recursive: true})
            await fs.mkdir(this.cryptoDir, {recursive: true})
            await fs.mkdir(this.dbDir, {recursive: true})
            await fs.mkdir(this.authDir, {recursive: true})
        } catch (err) {
            console.error('Unable to create necessary folder:', err);
        }
    }

    async setup() {
        try {
            await this.ensureDirExist()

            try {
                const pkgJson = path.join(prismaClient, 'package.json');
                await fs.access(pkgJson, fsConstants.F_OK);
                await fs.unlink(pkgJson);
            } catch (e) {
                // do nothing
            }

            try {
                const schemaFile = path.join(prismaClient, 'schema.prisma');
                await fs.access(schemaFile, fsConstants.F_OK);
                await fs.unlink(schemaFile);
            } catch (e) {
                // do nothing
            }

            this.zk = new Zokrates(this.clientId, this.apiKey, this.token, {
                path: this.zkDir,
                rest: new Rest(config.baseUrl)
            });
            await this.zk.setup();
            this._restClient = await new AuthorizedRest(config.baseUrl, this.clientId, this.zk, this.authDir);
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
