import {Proof} from "../../../index";
import Rest from "../rest/Rest";
import axios from 'axios';
import {promisify} from 'util';
import * as stream from 'stream';

const exec = require("child_process").execSync;
const path = require('path');
const fs = require("fs-extra");
let dir = path.dirname(__dirname);


export class Zokrates {

    private readonly _apiKey: string;
    private readonly _clientId: string;
    private readonly _token: string;
    private _execPath: any;
    private _libRoot: string;
    private _zokRoot: string;
    private _storePath: string;
    private _rest: Rest;

    constructor(clientId: string, apiKey: string, token: string, options: any) {
        if (!options.path) {
            throw new Error('Path not set')
        }
        this._rest = options.rest;
        this._apiKey = apiKey;
        this._clientId = clientId;
        this._token = token;

        this.setPaths(options.path)


    }
    async setup(){
        if (!this.filesExist()) {
            await this.getZkFiles(() => {
                const fields = this.getZkFields();
                this.computeWitness(fields[0], fields[1], fields[2], fields[3]);
            })
        }
    }

    filesExist() {
        if (fs.existsSync(`${this._storePath}${path.sep}out`) && `${this._storePath}${path.sep}proving.key`) {
            return true;
        } else {
            return false;
        }
    }

    private getZkFiles(callback: Function) {

        return new Promise(async (resolve, reject) => {
            console.log('DL Files')
            const finishedDownload = promisify(stream.finished);
            await this._rest.get(`/clientIds/${this._clientId}/download?token=${this._token}`).then(async (result)=>{
                const outEndPoint = result.data.data[0].sdk;
                const proovingPoint = result.data.data[0].proof;
                const out = await axios({
                    method: 'GET',
                    url: outEndPoint,
                    responseType: 'stream',
                })
                const outwriter = fs.createWriteStream(`${this._storePath}${path.sep}out`);
                out.data.pipe(outwriter)
                await finishedDownload(outwriter);
                const prooving = await axios({
                    method: 'GET',
                    url: proovingPoint,
                    responseType: 'stream',
                })
                const proovingwriter = fs.createWriteStream(`${this._storePath}${path.sep}proving.key`);
                prooving.data.pipe(proovingwriter)
                await finishedDownload(proovingwriter);
                callback();
                resolve(true)
            })

        })

    }

    private setPaths(_storePath: string) {
        const os = process.platform;
        const match = dir.match(/dist/);
        fs.ensureDirSync(_storePath);
        if (!match) {
            this._libRoot = dir + path.sep + 'zokrates';
        } else {
            this._libRoot = dir.replace('dist', 'zokrates');
        }
        this._zokRoot = this._libRoot;
        if (os === 'darwin' || os === 'win32') {
            this._execPath = this._libRoot + path.sep + os;
            this._libRoot = this._execPath;
        } else {
            this._execPath = this._libRoot + path.sep + 'linux';
            this._libRoot = this._execPath;
        }
        if (os === 'win32') {
            this._execPath = this._execPath + path.sep + 'zokrates.exe ';
        } else {
            this._execPath = this._execPath + path.sep + 'zokrates ';
        }
        fs.ensureDirSync(this._libRoot);
        this._storePath = _storePath;
    }

    private run(command: string) {
        const buff = exec(command);
        const result = buff.toString();
        const retObj: any = {
            error: null,
            result: null
        }
        if (result.match(/^error/i)) {
            retObj.error = result;
            return retObj
        } else {
            retObj.result = result;
            return retObj
        }

    }

    generateProof(): Proof | boolean {
        const command = `${this._execPath} generate-proof --input=${this._storePath}${path.sep}out --proving-key-path=${this._storePath}${path.sep}proving.key --witness=${this._storePath}${path.sep}witness --proof-path=${this._storePath}${path.sep}proof.json`;
        const compiled = this.run(command);
        if (!compiled.error) {
            return fs.readJsonSync(`${this._storePath}${path.sep}proof.json`);
        }
        console.log(compiled.error);
        return false;
    }

    computeWitness(field1: string, field2: string, field3: string, field4: string) {
        const command = this._execPath + `compute-witness -a ${field1} ${field2} ${field3} ${field4} --input=${this._storePath}${path.sep}out --output=${this._storePath}${path.sep}witness`;
        const computeWitness = this.run(command);
        if (!computeWitness.error) {
            return computeWitness.result;
        }
        return false;
    }

    private stringToNumberChunks(v: string) {
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

    private getZkFields() {
        const uuidChunks = this.stringToNumberChunks(this._clientId);
        const secretChunks = this.stringToNumberChunks(this._apiKey);
        return [uuidChunks[1].toString(), secretChunks[0].toString(), uuidChunks[0].toString(), secretChunks[1].toString()];
    };

}
