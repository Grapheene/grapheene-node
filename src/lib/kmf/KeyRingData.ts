import Key from "./Key";
import {KeyRingDataOptions, StorageServices} from "../../../index";



export default class KeyRingData {
    uuid: string;
    name: string;
    path: string;
    service: StorageServices;
    uniqueName: string;
    uniquePath: string;

    constructor(options:KeyRingDataOptions) {
        this.uuid = options.uuid;
        this.uniqueName = options.uniqueName;
        this.uniquePath = options.uniquePath;
        this.name = options.name;
        this.path = options.path;
        this.service = options.service;

    }

}
