// zero-knowledge implementation for Grapheene
// @ts-ignore
import * as zokrates from 'zokrates-js/node';


interface ZKProof {
    proof: Array<string>;
    inputs: Array<any>;
}

interface ZKDefaults {
    initialize_client: boolean;
    uuid: string;
    shared_secret: string;
}

//Take a UUID and format it as a number usable by ZoKrates
function stringToNumberChunks(v: string) {
    const split: Array<string> = v.split("");
    const numbers: Array<number> = [];
    const chunks: Array<any> = []
    for (let x in split) {
        numbers.push(split[x].charCodeAt(0))
    }

    let chunksize = numbers.join("").length / 6

    let i, j, temporary, chunk = chunksize;
    for (i = 0, j = numbers.length; i < j; i += chunk) {
        temporary = numbers.slice(i, i + chunk);
        chunks.push(temporary.join(""))
    }
    return chunks;
}


const defaults = {
    initialize_client: false
}

export class Zk {

    private _source: string;
    private _artifacts: zokrates.CompilationArtifacts;
    private _computation: zokrates.ComputationResult;
    private _keypair: zokrates.SetupKeypair;
    private _proof: zokrates.CompilationArtifacts;
    private _provider: zokrates.ZoKratesProvider;
    private _options: any;
    private _cache: any;

    constructor(options: any) {
        this._options = Object.assign({}, defaults, options);
        if (!this._options.hasOwnProperty('uuid') || !this._options.hasOwnProperty('shared_secret')) {
            throw new Error('ZK missing parameters')
        }
    }

    async init() {
        this._provider = await zokrates.initialize();
        let hash;
        if (this._options.initialize_client) {

            hash = this.computeHash(this._options.uuid, this._options.shared_secret)

            this.setSource(hash);
            this.compileZK();


            this.setWitness(this._options.uuid, this._options.shared_secret);
            this.setupZK();
            this.generateProof();
        }
        return true;

    }

    private setSource(hash: any) {
        this._source = "import \"hashes/sha256/512bitPacked\" as sha256packed\n" +
            "\n" +
            "def main(private field uuid, private field shared_secret, private field timestamp, private field salt):\n" +
            "    field[2] h = sha256packed([uuid, shared_secret, timestamp, salt])\n" +
            `    assert(h[0] == ${hash[0]})\n` +
            `    assert(h[1] == ${hash[1]})\n` +
            "    return";
    }

    private compileZK() {
        this._artifacts = this._provider.compile(this._source);
    }

    private computeHash(uuid: string, shared_secret: string) {
        const source = "import \"hashes/sha256/512bitPacked\" as sha256packed\n" +
            "\n" +
            "def main(private field uuid, private field shared_secret, private field timestamp, private field salt) -> field[2]:\n" +
            "    field[2] h = sha256packed([uuid, shared_secret, timestamp, salt])\n" +
            "    return h";
        const timestamp = this.timestamp;

        this._cache.set(uuid + 'timestamp', timestamp);
        const artifacts = this._provider.compile(source);
        const hash = this._provider.computeWitness(artifacts, this.getZkFields(uuid, shared_secret, timestamp));
        const output = JSON.parse(hash.output)[0];

        this._cache.set(uuid + 'HASH', [output[0], output[1]]);
        return [output[0], output[1]];
    }

    getZkFields(uuid: string, shared_secret: string, timestamp: number) {
        const uuidChunks = stringToNumberChunks(uuid);
        const secretChunks = stringToNumberChunks(shared_secret);

        // return [uuidChunks[1].toString(), secretChunks[0].toString(), "0", "0"];
        return [uuidChunks[1].toString(), secretChunks[0].toString(), timestamp.toString(), "0"];
    }

    private cacheNotExistOrExpired() {
        const exists = this._cache.exists(this._options.uuid + 'timestamp')
        if (!exists) {
            return true;
        } else {
            const timestamp = this._cache.get(this._options.uuid + 'timestamp')
            return timestamp !== this.timestamp;
        }
    }

    private get timestamp() {
        // Set timestamp to the day, means that proof will only be valid for 24 hours
        return new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 1000;
    }

    private setWitness(uuid: string, shared_secret: string) {
        this._computation = this._provider.computeWitness(this._artifacts, this.getZkFields(uuid, shared_secret, this.timestamp));
    }

    public setupZK() {
        this._keypair = this._provider.setup(this._artifacts.program);
    }

    private generateProof() {
        this._proof = this._provider.generateProof(this._artifacts.program, this._computation.witness, this._keypair.pk);
    }

    set proof(proof: ZKProof) {
        if (!proof.hasOwnProperty('inputs') || !proof.hasOwnProperty('proof')) {
            throw new Error('The proof is invalid');
        }
        this._proof = proof;
    }

    get proof() {
        if (typeof this._proof !== undefined) {
            return this._proof;
        } else {
            throw new Error('Proof not defined, did you forget to generateProof() or set proof?')
        }

    }

    set witness(witness: any) {
        this._computation = witness;
    }

    get witness() {
        if (typeof this._computation !== undefined) {
            return this._computation;
        } else {
            throw new Error('Witness not defined, did you forget to provide witness or init()?')
        }
    }

    set artifacts(artifacts: zokrates.CompilationArtifacts) {
        if (!artifacts.hasOwnProperty('program') || !artifacts.hasOwnProperty('abi')) {
            throw new Error('The artifacts are invalid');
        }
        this._artifacts = artifacts;
    }

    get artifacts() {
        if (typeof this._artifacts !== undefined) {
            return this._artifacts;
        } else {
            throw new Error('Artifacts not defined, did you forget to provide artifacts or init()?')
        }
    }

    set keypair(keypair: zokrates.SetupKeypair) {
        if (!keypair.hasOwnProperty('vk') || !keypair.hasOwnProperty('pk')) {
            throw new Error('The keypair is invalid');
        }
        this._keypair = keypair;
    }

    get keypair() {
        if (typeof this._keypair !== undefined) {
            return this._keypair;
        } else {
            throw new Error('Keypair not defined, did you forget to provide keypair or init()?')
        }
    }

    verify(proof: any) {
        return this._provider.verify(this._keypair.vk, proof);
    }


}
