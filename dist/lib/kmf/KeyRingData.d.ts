export default class KeyRingData {
    uuid: string;
    name: string;
    path: string;
    encrypted?: string;
    service: 'cloud' | 'local' | 'unsaved' | 'cloud:tmp:saved';
    constructor(options: KeyRingData);
}
