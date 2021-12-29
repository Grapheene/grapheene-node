
const defaults = {
}

class Grapheene {

    private readonly clientId: string;
    private readonly apiKey: string;
    private  _options: string;

    constructor(clientId: string, apiKey: string, opts?: any) {
        this._options = Object.assign({}, defaults, opts);
        this.apiKey = apiKey;
        this.clientId = clientId;

        if(!this.apiKey.startsWith('SK') || !this.apiKey){
            throw new Error('Invalid APK Key')
        }

        if(!this.clientId.startsWith('US') || !this.clientId){
            throw new Error('Invalid Client ID')
        }

    }

    public setup(){

    }

    public auth(){

    }

    get call () {
        return
    }



}

export default Grapheene