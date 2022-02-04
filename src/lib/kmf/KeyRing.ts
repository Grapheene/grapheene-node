import Member from "./Member";
import KeyRingData from "./KeyRingData";
import {KeyData, KeyRingOptions, MemberOptions} from "../../../index";
import Rest from "../rest/Rest";
import {Database} from "sqlite3";

// TODO: connect ring data / storage
// TODO: Hook into the dashboard API to pull program files

export default class KeyRing {
    uuid: string;
    uniqueName: string;
    name: string;
    data: Array<KeyRingData>
    members: Array<Member>
    createdAt: string;
    updatedAt: string;
    private _master: Member;
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
                    this._master = new Member(options.members[x].Member, this._db)
                } else {
                    this._master = new Member(options.members[x].Member, this._db)
                }

            } else {
                members.push(options.members[x].Member);
            }
        }
        for (let i in members) {
            this.members.push(new Member(members[i], this._db, this._master))
        }

    }

    async create(name: string) {
        const keyRing = await this._restClient.post('/kmf/ring', {ring_name: name});
        // console.log(keyRing.data);
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
            member = new Member(result.data.member.Member, this._db, this._master);
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
}

