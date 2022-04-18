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
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const exec = require("child_process").execSync;
const spawn = require("child_process").spawn;
let dir = path_1.default.dirname(__dirname);
class Zokrates {
    constructor(clientId, apiKey, token, options) {
        if (!options.path) {
            throw new Error('Path not set');
        }
        this._rest = options.rest;
        this._apiKey = apiKey;
        this._clientId = clientId;
        this._token = token;
        this._optionsPath = options.path;
    }
    setup() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                return this.setPaths(this._optionsPath).then(() => __awaiter(this, void 0, void 0, function* () {
                    if (!(yield this.filesExist())) {
                        this.getZkFiles().then(() => __awaiter(this, void 0, void 0, function* () {
                            const fields = this.getZkFields();
                            console.log('Computing witness files.');
                            yield this.computeWitness(fields[0], fields[1], fields[2], fields[3]);
                            console.log('Witness file computation complete.');
                            return resolve(true);
                        }));
                    }
                    else {
                        console.log('This client has already been setup.');
                        return resolve(true);
                    }
                }));
            }
            catch (e) {
                console.error('Error: \n', e);
                return reject(e);
            }
        }));
    }
    filesExist() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs_1.promises.access(`${this._storePath}${path_1.default.sep}out`, fs_1.constants.F_OK);
                yield fs_1.promises.access(`${this._storePath}${path_1.default.sep}proving.key`, fs_1.constants.F_OK);
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
    getZkFiles() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            console.log('Downloading Necessary Proof Files...');
            const finishedDownload = (0, util_1.promisify)(stream.finished);
            let outDownloadedBytes = 0;
            let outDownloadPercent = 0;
            let proofDownloadedBytes = 0;
            let proofDownloadPercent = 0;
            yield this._rest.get(`/clientIds/${this._clientId}/download?token=${this._token}`).then((result) => __awaiter(this, void 0, void 0, function* () {
                const outEndPoint = result.data.data[0].sdk;
                const proovingPoint = result.data.data[0].proof;
                try {
                    const prooving = yield (0, axios_1.default)({
                        method: 'GET',
                        url: proovingPoint,
                        responseType: 'stream',
                    });
                    const provingFd = yield fs_1.promises.open(`${this._storePath}${path_1.default.sep}proving.key`, 'w');
                    const proovingwriter = provingFd.createWriteStream();
                    const totalLengthP = parseInt(prooving.headers['content-length'], 10);
                    prooving.data.on('data', (chunk) => {
                        proofDownloadedBytes += chunk.length;
                        const prevPercent = proofDownloadPercent;
                        proofDownloadPercent = Math.ceil(proofDownloadedBytes / totalLengthP * 100);
                        if (proofDownloadPercent > prevPercent) {
                            process.stdout.write(`\rproof download: ${proofDownloadPercent}%`);
                        }
                    });
                    prooving.data.pipe(proovingwriter);
                    yield finishedDownload(proovingwriter);
                }
                catch (err) {
                    console.error('There was an error downloading the prooving file:', err);
                }
                process.stdout.write('\n');
                try {
                    const out = yield (0, axios_1.default)({
                        method: 'GET',
                        url: outEndPoint,
                        responseType: 'stream',
                    });
                    const totalLength = parseInt(out.headers['content-length'], 10);
                    const outFd = yield fs_1.promises.open(`${this._storePath}${path_1.default.sep}out`, 'w');
                    const outwriter = outFd.createWriteStream();
                    out.data.on('data', (chunk) => {
                        outDownloadedBytes += chunk.length;
                        const prevPercent = outDownloadPercent;
                        outDownloadPercent = Math.ceil(outDownloadedBytes / totalLength * 100);
                        if (outDownloadPercent > prevPercent) {
                            process.stdout.write(`\rout download: ${outDownloadPercent}%`);
                        }
                    });
                    out.data.pipe(outwriter);
                    yield finishedDownload(outwriter);
                }
                catch (err) {
                    console.error('There was an error downloading the out file:', err);
                }
                process.stdout.write('\n');
                console.log('Download Complete.');
                return resolve(true);
            }));
        }));
    }
    setPaths(_storePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const os = process.platform;
            const match = dir.match(/dist/);
            yield fs_1.promises.mkdir(_storePath, { recursive: true });
            // fs.ensureDirSync(_storePath);
            if (!match) {
                this._libRoot = dir + path_1.default.sep + 'zokrates';
            }
            else {
                this._libRoot = dir.replace('dist', 'zokrates');
            }
            this._zokRoot = this._libRoot;
            if (os === 'darwin' || os === 'win32') {
                this._execPath = this._libRoot + path_1.default.sep + os;
                this._libRoot = this._execPath;
            }
            else {
                this._execPath = this._libRoot + path_1.default.sep + 'linux';
                this._libRoot = this._execPath;
            }
            if (os === 'win32') {
                this._execPath = this._execPath + path_1.default.sep + 'zokrates.exe ';
            }
            else {
                this._execPath = this._execPath + path_1.default.sep + 'zokrates ';
            }
            yield fs_1.promises.mkdir(this._libRoot, { recursive: true });
            // fs.ensureDirSync(this._libRoot);
            this._storePath = _storePath;
        });
    }
    run(command) {
        const buff = exec(command, { timeout: 5000 });
        const result = buff.toString();
        const retObj = {
            error: false,
            result: false
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
    spawn(command, args, options) {
        return new Promise((resolve, reject) => {
            let childProcess = spawn(command, args, options);
            let std_out = '';
            let std_err = '';
            childProcess.stdout.on('data', function (data) {
                std_out += data.toString();
                console.log(data.toString());
            });
            childProcess.stderr.on('data', function (data) {
                std_err += data.toString();
                console.error(data.toString());
            });
            childProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(`exit_code = ${code}`);
                    return resolve(std_out);
                }
                else {
                    console.warn(`exit_code = ${code}`);
                    return reject(std_err);
                }
            });
            childProcess.on('error', (error) => {
                std_err += error.toString();
                console.error(error.toString());
            });
        });
    }
    generateProof() {
        const command = `${this._execPath} generate-proof --input=${this._storePath}${path_1.default.sep}out --proving-key-path=${this._storePath}${path_1.default.sep}proving.key --witness=${this._storePath}${path_1.default.sep}witness --proof-path=${this._storePath}${path_1.default.sep}proof.json`;
        const compiled = this.run(command);
        if (!compiled.error) {
            return require(`${this._storePath}${path_1.default.sep}proof.json`);
        }
        console.error('Unable to generate proof:', compiled.error);
        return false;
    }
    computeWitness(field1, field2, field3, field4) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const command = this._execPath + `compute-witness`;
                yield this.spawn(command, [`-a ${field1} ${field2} ${field3} ${field4}`, `--input=${this._storePath}${path_1.default.sep}out`, `   --output=${this._storePath}${path_1.default.sep}witness`], { shell: true });
                return resolve(true);
            }
            catch (e) {
                console.error(e);
                reject(e);
            }
        }));
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