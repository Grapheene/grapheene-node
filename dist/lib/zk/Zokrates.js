"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.Zokrates = void 0;
const axios_1 = __importDefault(require("axios"));
const util_1 = require("util");
const stream = __importStar(require("stream"));
const exec = require("child_process").execSync;
const path = require('path');
const fs = require("fs-extra");
let dir = path.dirname(__dirname);
class Zokrates {
    constructor(clientId, apiKey, token, options) {
        if (!options.path) {
            throw new Error('Path not set');
        }
        this._rest = options.rest;
        this._apiKey = apiKey;
        this._clientId = clientId;
        this._token = token;
        this.setPaths(options.path);
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.filesExist()) {
                yield this.getZkFiles(() => {
                    const fields = this.getZkFields();
                    this.computeWitness(fields[0], fields[1], fields[2], fields[3]);
                });
            }
        });
    }
    filesExist() {
        if (fs.existsSync(`${this._storePath}${path.sep}out`) && `${this._storePath}${path.sep}proving.key`) {
            return true;
        }
        else {
            return false;
        }
    }
    getZkFiles(callback) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            console.log('DL Files');
            const finishedDownload = (0, util_1.promisify)(stream.finished);
            yield this._rest.get(`/clientIds/${this._clientId}/download?token=${this._token}`).then((result) => __awaiter(this, void 0, void 0, function* () {
                const outEndPoint = result.data.data[0].sdk;
                const proovingPoint = result.data.data[0].proof;
                const out = yield (0, axios_1.default)({
                    method: 'GET',
                    url: outEndPoint,
                    responseType: 'stream',
                });
                const outwriter = fs.createWriteStream(`${this._storePath}${path.sep}out`);
                out.data.pipe(outwriter);
                yield finishedDownload(outwriter);
                const prooving = yield (0, axios_1.default)({
                    method: 'GET',
                    url: proovingPoint,
                    responseType: 'stream',
                });
                const proovingwriter = fs.createWriteStream(`${this._storePath}${path.sep}proving.key`);
                prooving.data.pipe(proovingwriter);
                yield finishedDownload(proovingwriter);
                callback();
                resolve(true);
            }));
        }));
    }
    setPaths(_storePath) {
        const os = process.platform;
        const match = dir.match(/dist/);
        fs.ensureDirSync(_storePath);
        if (!match) {
            this._libRoot = dir + path.sep + 'zokrates';
        }
        else {
            this._libRoot = dir.replace('dist', 'zokrates');
        }
        this._zokRoot = this._libRoot;
        if (os === 'darwin' || os === 'win32') {
            this._execPath = this._libRoot + path.sep + os;
            this._libRoot = this._execPath;
        }
        else {
            this._execPath = this._libRoot + path.sep + 'linux';
            this._libRoot = this._execPath;
        }
        if (os === 'win32') {
            this._execPath = this._execPath + path.sep + 'zokrates.exe ';
        }
        else {
            this._execPath = this._execPath + path.sep + 'zokrates ';
        }
        fs.ensureDirSync(this._libRoot);
        this._storePath = _storePath;
    }
    run(command) {
        const buff = exec(command);
        const result = buff.toString();
        const retObj = {
            error: null,
            result: null
        };
        if (result.match(/^error/i)) {
            retObj.error = result;
            return retObj;
        }
        else {
            retObj.result = result;
            return retObj;
        }
    }
    generateProof() {
        const command = `${this._execPath} generate-proof --input=${this._storePath}${path.sep}out --proving-key-path=${this._storePath}${path.sep}proving.key --witness=${this._storePath}${path.sep}witness --proof-path=${this._storePath}${path.sep}proof.json`;
        const compiled = this.run(command);
        if (!compiled.error) {
            return fs.readJsonSync(`${this._storePath}${path.sep}proof.json`);
        }
        console.log(compiled.error);
        return false;
    }
    computeWitness(field1, field2, field3, field4) {
        const command = this._execPath + `compute-witness -a ${field1} ${field2} ${field3} ${field4} --input=${this._storePath}${path.sep}out --output=${this._storePath}${path.sep}witness`;
        const computeWitness = this.run(command);
        if (!computeWitness.error) {
            return computeWitness.result;
        }
        return false;
    }
    stringToNumberChunks(v) {
        const split = v.split('');
        const numbers = [];
        const chunks = [];
        for (let x in split) {
            numbers.push(split[x].charCodeAt(0));
        }
        let chunksize = numbers.join('').length / 6;
        let i, j, temporary, chunk = chunksize;
        for (i = 0, j = numbers.length; i < j; i += chunk) {
            temporary = numbers.slice(i, i + chunk);
            chunks.push(temporary.join(''));
        }
        return chunks;
    }
    getZkFields() {
        const uuidChunks = this.stringToNumberChunks(this._clientId);
        const secretChunks = this.stringToNumberChunks(this._apiKey);
        return [uuidChunks[1].toString(), secretChunks[0].toString(), uuidChunks[0].toString(), secretChunks[1].toString()];
    }
    ;
}
exports.Zokrates = Zokrates;
//# sourceMappingURL=Zokrates.js.map