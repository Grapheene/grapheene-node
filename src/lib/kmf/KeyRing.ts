import Member from "./Member";
import KeyRingData from "./KeyRingData";
import {KeyData, KeyRingDataOptions, KeyRingDataRequest, KeyRingOptions, MemberOptions} from "../../../index";
import Rest from "../rest/Rest";
import {Database} from "sqlite3";
import {Storage} from "../storage/Storage";

// TODO: connect ring data / storage
// TODO: Hook into the dashboard API to pull program files
// TODO: Add mongo db connector

export default class KeyRing {
    uuid: string;
    uniqueName: string;
    name: string;
    data: Array<KeyRingData>
    members: Array<Member>
    createdAt: string;
    updatedAt: string;
    private _master: Member;
    private _storage: Storage;
    private readonly _restClient: Rest;
    private readonly _db: Database;

    constructor(restClient: Rest, DB: Database, options?: KeyRingOptions) {
        if (options) {
            this.setOptions(options)
        }
        this.data = [];
        this.members = [];
        this._restClient = restClient;
        this._db = DB;

    }

    private setOptions(options: KeyRingOptions, key?: KeyData) {
        this.uuid = options.uuid;
        this.uniqueName = options.uniqueName;
        this.name = options.name;
        this.createdAt = options.createdAt;
        this.updatedAt = options.updatedAt;
        for (let x in options.data) {
            this.data.push(new KeyRingData(options.data[x]))
        }
        let members: Array<Member> = [];
        for (let x in options.members) {
            if (options.members[x].role === 'master') {
                if (key) {
                    options.members[x].Member.keys[0].data = key;
                    this._master = new Member(options.members[x].Member, this._db, this)
                } else {
                    this._master = new Member(options.members[x].Member, this._db, this)
                }

            } else {
                members.push(options.members[x].Member);
            }
        }
        for (let i in members) {
            this.members.push(new Member(members[i], this._db, this, this._master))
        }
        this.enableMemberStorage();
    }

    async create(name: string) {
        const keyRing = await this._restClient.post('/kmf/ring', {ring_name: name});
        this.setOptions(keyRing.data.keyRing, keyRing.data.key)
        return this;
    }

    async load(nameOrUUID: string) {
        let params: { ring_name?: string, uuid?: string } = {ring_name: nameOrUUID}
        if (nameOrUUID.length === 34) {
            params = {uuid: nameOrUUID}
        }
        const keyRing = await this._restClient.post('/kmf/ring', params);
        this.setOptions(keyRing.data)
        return this;
    }

    getMember(nameOrUUID: string) {
        if (this.members.length === 0) {
            throw new Error('Key ring has no members');
        } else {
            for (let x in this.members) {
                if (this.members[x].uuid === nameOrUUID || this.members[x].name === nameOrUUID) {
                    return this.members[x];
                }
            }
        }

    }

    async addMember(data: MemberOptions) {

        for (let x in this.members) {
            if (this.members[x].name === data.name) {
                return this.members[x];
            }
        }

        const result = await this._restClient.post('/kmf/ring/' + this.uuid + '/member/add', data);
        let member: Member;
        if (result.status === 200) {
            member = new Member(result.data.member.Member, this._db, this, this._master);
            member.save = this._storage.save;
            member.delete = this._storage.delete;
            this.members.push(member)
        } else {
            throw new Error(result.statusText)
        }
        return member;

    }

    async delMember(nameOrUUID: string) {
        if (this.members.length === 0) {
            throw new Error('Key ring has no members');
        } else {
            let members: Array<Member> = [];
            for (let x in this.members) {
                if (this.members[x].uuid === nameOrUUID || this.members[x].name === nameOrUUID) {
                    await this._restClient.del('/kmf/ring/' + this.uuid + '/member/' + this.members[x].uuid);
                    this.members[x].destroy().then((message) => {
                        console.log(message)
                    }).catch(console.log)

                } else {
                    members.push(this.members[x]);
                }
            }

            this.members = members;
        }
    }

    getData(nameOrUUID: string) {
        if (this.data.length === 0) {
            throw new Error('Key ring has no data');
        } else {
            for (let x in this.data) {
                if (this.data[x].uuid === nameOrUUID || this.data[x].name === nameOrUUID) {
                    return this.data[x];
                }
            }
        }

    }

    async addData(request: KeyRingDataRequest) {

        for (let x in this.data) {
            if (this.data[x].name === request.name) {
                return this.data[x];
            }
        }

        const result = await this._restClient.post('/kmf/ring/' + this.uuid + '/data/add', request);
        let data: KeyRingData;
        if (result.status === 200) {
            data = new KeyRingData(result.data.ringData);
            this.data.push(data)
            return data;
        } else {
            throw new Error(result.statusText)
        }

    }

    async updateData(request: KeyRingData) {

        const result = await this._restClient.put('/kmf/ring/' + this.uuid + '/data/' + request.uuid, request);
        let dataResponse: KeyRingData;
        if (result.status === 200) {
            let data: Array<KeyRingData> = []
            for (let x in this.data) {
                if (this.data[x].uuid === request.uuid) {
                    data.push(this.data[x]);
                }
            }
            dataResponse = new KeyRingData(result.data.ringData);
            data.push(dataResponse)
            this.data = data;
            return data;
        } else {
            throw new Error(result.statusText)
        }

    }

    async delData(nameOrUUID: string) {
        if (this.data.length === 0) {
            throw new Error('Key ring has no members');
        } else {
            let data: Array<KeyRingData> = [];
            for (let x in this.data) {
                if (this.data[x].uuid === nameOrUUID || this.data[x].name === nameOrUUID) {
                    await this._restClient.del('/kmf/ring/' + this.uuid + '/data/' + this.data[x].uuid);
                } else {
                    data.push(this.data[x]);
                }
            }

            this.data = data;
        }
    }

    private enableMemberStorage() {
        if (this.members.length > 0) {
            for (let x in this.members) {
                this.members[x].save = this._storage.save;
                this.members[x].delete = this._storage.delete;

            }
        }
    }

    set storage(storage: Storage) {
        this._storage = storage;
        this.enableMemberStorage();
    }

    get storage() {
        return this._storage;
    }
}

