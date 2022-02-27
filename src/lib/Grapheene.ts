import AuthorizedRest from "./rest/AuthorizedRest";
import {Zokrates} from "./zk/Zokrates";
import {KMF} from "./kmf/KMF";
import {Database} from "sqlite3";
import {Storage} from "./storage/Storage";
import {GrapheeneOptions} from "../../index";
import {execSync as exec, spawnSync as spawn} from "child_process";
import Rest from "./rest/Rest";

const config = require('../../config.json')
const sqlite = require('sqlite3').verbose();

const fs = require('fs-extra');
const path = require('path');
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
            if (process.env.DATABASE_URL) {
                this.setupDb()
            } else {
                this._db = new sqlite.Database(this.dbDir + path.sep + 'grapheene.db', (err: Error) => {
                    if (err) {
                        throw new Error(err.message)
                    }
                    this.setupDevDb();
                });
            }

            this.setupKMS()
            this.setupStorage()
            this._kmf.ring.storage = this._storage;
            return true;
        } catch (e) {
            console.error('Unable to setup Grapheene:', e);
            return false;
        }
    }


    private setupDevDb() {
        let tables: Array<string> = []
        if (this._db instanceof Database) {
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
                    if (this._db instanceof Database) {
                        this._db.run('CREATE TABLE keystore (uuid TEXT, active INT,  data TEXT)');
                    }
                }
            });
        }
    }

    private setupDb() {
        if (fs.existsSync(this.prismaDir + '/schema.prisma')) {
            fs.unlinkSync(this.prismaDir + '/schema.prisma')
        }

        if (!fs.existsSync(this.prismaDir + '/schema.prisma')) {

            if (process.env.DATABASE_URL.match(/^mongodb/)) {
                fs.copyFileSync(this.prismaDir + '/schemas/mongo.prisma', this.prismaDir + '/schema.prisma')
                this.run('prisma generate')
            }

            if (process.env.DATABASE_URL.match(/^post/)) {
                fs.copyFileSync(this.prismaDir + '/schemas/postgres.prisma', this.prismaDir + '/schema.prisma');
                this.run('prisma generate --schema ' + this.prismaDir + '/schema.prisma');
                if (!fs.existsSync(this.prismaDir + '/migrations')) {
                    if (this._options.db.migrate) {
                        this.run('prisma migrate dev --name init --schema ' + this.prismaDir + '/schema.prisma');
                        this.run('prisma migrate deploy --schema ' + this.prismaDir + '/schema.prisma');
                    }

                }
            }


        }
        while (!fs.existsSync(node_modules + '/.prisma/client/schema.prisma')) {
            process.stdout.write('\rSetting up database...');
        }
        process.stdout.write('done!\n');
        const {PrismaClient} = require('@prisma/client');

        this._db = new PrismaClient()

    }

    private run(command: string, interactive?: boolean) {
        let buff;
        if (!interactive) {
            buff = exec(command);
        } else {
            buff = spawn(command);
        }


        const result = buff.toString();
        const retObj: any = {
            error: null,
            result: null
        }
        if (result.match(/^error/i)) {
            retObj.error = result;
            console.error(`Unable to run ${command}:`, retObj.error);
            return retObj
        } else {
            retObj.result = result;
            return retObj
        }

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
