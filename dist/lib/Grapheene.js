"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grapheene = void 0;
const AuthorizedRest_1 = __importDefault(require("./rest/AuthorizedRest"));
const Zokrates_1 = require("./zk/Zokrates");
const KMF_1 = require("./kmf/KMF");
const Storage_1 = require("./storage/Storage");
const DatabaseGenerator_1 = require("./DatabaseGenerator");
const Rest_1 = __importDefault(require("./rest/Rest"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const Paths_1 = require("./shared/Paths");
const config = require('../../config.json');
const defaults = {
    medium: 'local',
    dir: './',
    projectDir: '.grapheene',
    db: {
        migrate: false
    },
};
class Grapheene {
    constructor(clientId, apiKey, token, opts) {
        this._options = Object.assign({}, defaults, opts);
        this.apiKey = apiKey;
        this.clientId = clientId;
        this.token = token;
        this.filesDir = process.cwd() + path_1.default.sep + this._options.projectDir + path_1.default.sep + this.clientId + path_1.default.sep + 'files';
        this.prismaDir = path_1.default.dirname(__dirname).replace(/(dist.*)/, 'prisma');
        /*
        if (!this.apiKey.startsWith('SK') || !this.apiKey) {
            throw new Error('Invalid APK Key')
        }

        if (!this.clientId.startsWith('US') || !this.clientId) {
            throw new Error('Invalid Client ID')
        }
        */
        this.zkDir = this.filesDir + path_1.default.sep + 'zk';
        this.cryptoDir = this.filesDir + path_1.default.sep + 'encrypt';
        this.dbDir = this.filesDir + path_1.default.sep + 'db';
        this.authDir = this.filesDir + path_1.default.sep + 'auth';
    }
    ensureDirExist() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const isNewProject = yield fs_1.promises.mkdir(this.filesDir, { recursive: true });
                if (isNewProject) {
                    console.log(`It looks like you have created a new project! Be sure to add "${this._options.projectDir}" to your .gitignore`);
                }
                yield fs_1.promises.mkdir(this.zkDir, { recursive: true });
                yield fs_1.promises.mkdir(this.cryptoDir, { recursive: true });
                yield fs_1.promises.mkdir(this.dbDir, { recursive: true });
                yield fs_1.promises.mkdir(this.authDir, { recursive: true });
            }
            catch (err) {
                console.error('Unable to create necessary folder:', err);
            }
        });
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.ensureDirExist();
                try {
                    const pkgJson = path_1.default.join(Paths_1.prismaClient, 'package.json');
                    yield fs_1.promises.access(pkgJson, fs_1.constants.F_OK);
                    yield fs_1.promises.unlink(pkgJson);
                }
                catch (e) {
                    // do nothing
                }
                try {
                    const schemaFile = path_1.default.join(Paths_1.prismaClient, 'schema.prisma');
                    yield fs_1.promises.access(schemaFile, fs_1.constants.F_OK);
                    yield fs_1.promises.unlink(schemaFile);
                }
                catch (e) {
                    // do nothing
                }
                this.zk = new Zokrates_1.Zokrates(this.clientId, this.apiKey, this.token, {
                    path: this.zkDir,
                    rest: new Rest_1.default(config.baseUrl)
                });
                yield this.zk.setup();
                this._restClient = yield new AuthorizedRest_1.default(config.baseUrl, this.clientId, this.zk, this.authDir);
                yield this.setupDb();
                this.setupKMS();
                this.setupStorage();
                this._kmf.ring.storage = this._storage;
                return true;
            }
            catch (e) {
                console.error('Unable to setup Grapheene:', e);
                return false;
            }
        });
    }
    setupDb() {
        return __awaiter(this, void 0, void 0, function* () {
            this._db = (yield (0, DatabaseGenerator_1.DatabaseGenerator)(Object.assign(Object.assign({}, this._options), { dir: this.dbDir })));
        });
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