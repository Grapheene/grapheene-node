import Rest from "../rest/Rest";

export class KMS {

    private _restClient: Rest;


    constructor(RestClient: Rest) {
        this._restClient = RestClient;
    }

    async generate() {
        const keyResult = await this._restClient.post('/key/generate');
        console.warn('Store your keys somewhere safe!')
        return keyResult.data;
    }

}
