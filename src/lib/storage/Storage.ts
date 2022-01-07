import Rest from "../rest/Rest";
import {CryptoKeys} from "../../../index";

export class Storage {

    private _restClient: Rest;
    private _keys: CryptoKeys;


    constructor(RestClient: Rest) {
        this._restClient = RestClient;
    }

    generate() {

    }

    async configureKeys(keys: CryptoKeys) {

    }

    watch(){


    }


}
