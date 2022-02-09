


export default class KeyRingData {
    uuid: string;
    name: string;
    path: string;
    encrypted?: string;
    service: 'cloud' | 'local' | 'unsaved';

    constructor(options:KeyRingData) {

        this.uuid = options.uuid;
        this.name = options.name;
        this.path = options.path;
        this.service = options.service;

    }

}
