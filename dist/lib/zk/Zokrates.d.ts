import { Proof } from "../../../index";
export declare class Zokrates {
    private readonly _apiKey;
    private readonly _clientId;
    private readonly _token;
    private _execPath;
    private _libRoot;
    private _zokRoot;
    private _optionsPath;
    private _storePath;
    private _rest;
    constructor(clientId: string, apiKey: string, token: string, options: any);
    setup(): Promise<void>;
    filesExist(): Promise<boolean>;
    private getZkFiles;
    private setPaths;
    private run;
    generateProof(): Proof | boolean;
    computeWitness(field1: string, field2: string, field3: string, field4: string): any;
    private stringToNumberChunks;
    private getZkFields;
}
