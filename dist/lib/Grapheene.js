"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grapheene = void 0;
const AuthorizedRest_1 = require("./rest/AuthorizedRest");
const Zokrates_1 = require("./zk/Zokrates");
const KMF_1 = require("./kmf/KMF");
const sqlite3_1 = require("sqlite3");
const Storage_1 = require("./storage/Storage");
const child_process_1 = require("child_process");
const config = require('../../config.json');
const sqlite = require('sqlite3').verbose();
const node_modules = require('node_modules-path');
const fs = require('fs-extra');
const path = require('path');
const defaults = {
    medium: 'local',
    dir: './'
};
if (fs.existsSync(node_modules() + '/.prisma/client/package.json')) {
    fs.unlinkSync(node_modules() + '/.prisma/client/package.json');
}
if (fs.existsSync(node_modules() + '/.prisma/client/schema.prisma')) {
    fs.unlinkSync(node_modules() + '/.prisma/client/schema.prisma');
}
class Grapheene {
    constructor(clientId, apiKey, opts) {
        this._options = Object.assign({}, defaults, opts);
        this.apiKey = apiKey;
        this.clientId = clientId;
        this.filesDir = path.dirname(__dirname) + path.sep + 'files';
        this.prismaDir = path.dirname(__dirname).replace(/(dist.*)/, 'prisma');
        if (!this.apiKey.startsWith('SK') || !this.apiKey) {
            throw new Error('Invalid APK Key');
        }
        if (!this.clientId.startsWith('US') || !this.clientId) {
            throw new Error('Invalid Client ID');
        }
        this.zkDir = this.filesDir + path.sep + 'zk';
        this.cryptoDir = this.filesDir + path.sep + 'encrypt';
        this.dbDir = this.filesDir + path.sep + 'db';
        this.authDir = this.filesDir + path.sep + 'auth';
        this.ensureDirExist();
        this.setupZK();
        this._restClient = new AuthorizedRest_1.default(config.baseUrl, this.clientId, this.zk, this.authDir);
        if (process.env.DATABASE_URL) {
            this.setupDb();
        }
        else {
            this._db = new sqlite.Database(this.dbDir + path.sep + 'grapheene.db', (err) => {
                if (err) {
                    throw new Error(err.message);
                }
                this.setupDevDb();
            });
        }
        this.setupKMS();
        this.setupStorage();
        this._kmf.ring.storage = this._storage;
    }
    ensureDirExist() {
        fs.ensureDirSync(this.filesDir);
        fs.ensureDirSync(this.zkDir);
        fs.ensureDirSync(this.cryptoDir);
        fs.ensureDirSync(this.dbDir);
        fs.ensureDirSync(this.authDir);
    }
    setupZK() {
        this.zk = new Zokrates_1.Zokrates(this.clientId, this.apiKey, { path: this.zkDir });
    }
    setupDevDb() {
        let tables = [];
        if (this._db instanceof sqlite3_1.Database) {
            this._db.all('SELECT \n' +
                '    *\n' +
                'FROM \n' +
                '    sqlite_master\n' +
                'WHERE \n' +
                '    type =\'table\' AND \n' +
                '    name NOT LIKE \'sqlite_%\'', (err, rows) => {
                if (err) {
                    throw new Error(err.message);
                }
                for (let x in rows) {
                    tables.push(rows[x].name);
                }
                if (!tables.includes('keystore')) {
                    // this._db.run('CREATE TABLE keystore (ringUUID TEXT, keyUUID TEXT, keyType TEXT,active INT,  data TEXT)');
                    if (this._db instanceof sqlite3_1.Database) {
                        this._db.run('CREATE TABLE keystore (uuid TEXT, active INT,  data TEXT)');
                    }
                }
            });
        }
    }
    setupDb() {
        if (fs.existsSync(this.prismaDir + '/schema.prisma')) {
            fs.unlinkSync(this.prismaDir + '/schema.prisma');
        }
        if (!fs.existsSync(this.prismaDir + '/schema.prisma')) {
            if (process.env.DATABASE_URL.match(/^mongodb/)) {
                fs.copyFileSync(this.prismaDir + '/schemas/mongo.prisma', this.prismaDir + '/schema.prisma');
                this.run('prisma generate');
            }
            if (process.env.DATABASE_URL.match(/^post/)) {
                fs.copyFileSync(this.prismaDir + '/schemas/postgres.prisma', this.prismaDir + '/schema.prisma');
                this.run('prisma generate');
                if (!fs.existsSync(this.prismaDir + '/migrations')) {
                    this.run('prisma migrate dev --name init --schema ' + this.prismaDir + '/schema.prisma', true);
                    this.run('prisma migrate deploy --schema ' + this.prismaDir + '/schema.prisma', true);
                }
            }
        }
        while (!fs.existsSync(node_modules() + '/.prisma/client/schema.prisma')) {
            console.log('Setting Up DB');
        }
        const { PrismaClient } = require('@prisma/client');
        this._db = new PrismaClient();
    }
    run(command, interactive) {
        let buff;
        if (!interactive) {
            buff = (0, child_process_1.execSync)(command);
        }
        else {
            buff = (0, child_process_1.spawnSync)(command);
        }
        const result = buff.toString();
        const retObj = {
            error: null,
            result: null
        };
        if (result.match(/^error/i)) {
            retObj.error = result;
            console.error(retObj.error);
            return retObj;
        }
        else {
            retObj.result = result;
            // console.log(retObj.result)
            return retObj;
        }
    }
    setupKMS() {
        this.kmf = new KMF_1.KMF(this._restClient, this._db);
    }
    setupStorage() {
        this.storage = new Storage_1.Storage({ medium: this._options.medium }, this._restClient, this._kmf);
    }
    set zk(zk) {
        this._zk = zk;
    }
    get zk() {
        return this._zk;
    }
    set kmf(kmf) {
        this._kmf = kmf;
    }
    get kmf() {
        return this._kmf;
    }
    set storage(storage) {
        this._storage = storage;
    }
    get storage() {
        return this._storage;
    }
}
exports.Grapheene = Grapheene;
//# sourceMappingURL=Grapheene.js.map