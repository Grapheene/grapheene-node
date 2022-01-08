"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Zokrates = void 0;
const exec = require("child_process").execSync;
const path = require('path');
const fs = require("fs-extra");
let dir = path.dirname(require.main.filename || process.mainModule.filename);
class Zokrates {
    constructor(clientId, apiKey, options) {
        if (!options.path) {
            throw new Error('Path not set');
        }
        this._apiKey = apiKey;
        this._clientId = clientId;
        this.setPaths(options.path);
        const fields = this.getZkFields();
        this.computeWitness(fields[0], fields[1], fields[2], fields[3]);
    }
    setPaths(_storePath) {
        const os = require('os');
        const match = dir.match(/dist/);
        if (!match) {
            this._libRoot = dir + '/zokrates';
        }
        else {
            this._libRoot = dir.replace('dist', 'zokrates');
        }
        this._zokRoot = this._libRoot;
        if (os === 'darwin' || os === 'win32') {
            this._execPath = this._libRoot + '/' + os;
            this._libRoot = this._execPath;
        }
        else {
            this._execPath = this._libRoot + '/linux';
            this._libRoot = this._execPath;
        }
        if (os === 'win32') {
            this._execPath = this._execPath + '/zokrates.exe ';
        }
        else {
            this._execPath = this._execPath + '/zokrates ';
        }
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
        const command = `${this._execPath} generate-proof --input=${this._storePath}/out --proving-key-path=${this._storePath}/proving.key --witness=${this._storePath}/witness --proof-path=${this._storePath}/proof.json`;
        const compiled = this.run(command);
        if (!compiled.error) {
            return fs.readJsonSync(`${this._storePath}/proof.json`);
        }
        console.log(compiled.error);
        return false;
    }
    computeWitness(field1, field2, field3, field4) {
        const command = this._execPath + `compute-witness -a ${field1} ${field2} ${field3} ${field4} --input=${this._storePath}/out --output=${this._storePath}/witness`;
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