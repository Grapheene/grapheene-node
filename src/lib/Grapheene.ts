import AuthorizedRest from "./rest/AuthorizedRest";
import {Zokrates} from "./zk/Zokrates";
import {KMF} from "./kmf/KMF";

import {Database} from "sqlite3";
import {Storage} from "./storage/Storage";
import {GrapheeneOptions} from "../../index";

const config = require('../../config.json')
const sqlite = require('sqlite3').verbose();

const fs = require('fs-extra');
const path = require('path');
const defaults = {
    medium: 'local',
    dir: './'
}


export class Grapheene {

    private readonly clientId: string;
    private readonly apiKey: string;
    private readonly filesDir: string;
    private readonly zkDir: string;
    private readonly cryptoDir: string;
    private readonly dbDir: string;
    private readonly authDir: string;
    private readonly _restClient: AuthorizedRest;
    private readonly _db: Database;

    private _options: GrapheeneOptions;
    private _kmf: KMF;
    private _zk: Zokrates;
    private _storage: any;

    constructor(clientId: string, apiKey: string, opts?: GrapheeneOptions) {
        this._options = Object.assign({}, defaults, opts);
        this.apiKey = apiKey;
        this.clientId = clientId;


        this.filesDir = path.dirname(require.main.filename || process.mainModule.filename) + '/files'

        if (!this.apiKey.startsWith('SK') || !this.apiKey) {
            throw new Error('Invalid APK Key')
        }

        if (!this.clientId.startsWith('US') || !this.clientId) {
            throw new Error('Invalid Client ID')
        }

        this.zkDir = this.filesDir + '/zk';
        this.cryptoDir = this.filesDir + '/encrypt';
        this.dbDir = this.filesDir + '/db';
        this.authDir = this.filesDir + '/auth';

        this.ensureDirExist()
        this.setupZK()
        this._restClient = new AuthorizedRest(config.baseUrl, this.clientId, this.zk, this.authDir);
        this._db = new sqlite.Database(this.dbDir + '/grapheene.db', (err: Error) => {
            if (err) {
                throw new Error(err.message)
            }
            this.setupDb();
        });
        this.setupKMS()
        this.setupStorage()
        this._kmf.ring.storage = this._storage;
    }

    private ensureDirExist() {
        fs.ensureDirSync(this.filesDir)
        fs.ensureDirSync(this.zkDir)
        fs.ensureDirSync(this.cryptoDir)
        fs.ensureDirSync(this.dbDir)
        fs.ensureDirSync(this.authDir)
    }

    private setupZK() {
        this.zk = new Zokrates(this.clientId, this.apiKey, {path: this.zkDir});

    }

    private setupDb() {
        let tables: Array<string> = []
        this._db.all('SELECT \n' +
            '    *\n' +
            'FROM \n' +
            '    sqlite_master\n' +
            'WHERE \n' +
            '    type =\'table\' AND \n' +
            '    name NOT LIKE \'sqlite_%\'', (err: Error, rows: Array<{ name: string }>) => {
            if (err) {
                throw  new Error(err.message)
            }
            for (let x in rows) {
                tables.push(rows[x].name)
            }
            if (!tables.includes('keystore')) {
                // this._db.run('CREATE TABLE keystore (ringUUID TEXT, keyUUID TEXT, keyType TEXT,active INT,  data TEXT)');
                this._db.run('CREATE TABLE keystore (uuid TEXT, active INT,  data TEXT)');
            }
        });
    }

    private setupKMS() {
        this.kmf = new KMF(this._restClient, this._db);
    }

    private setupStorage(){
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
