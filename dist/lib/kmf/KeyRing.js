"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Member_1 = __importDefault(require("./Member"));
const KeyRingData_1 = __importDefault(require("./KeyRingData"));
class KeyRing {
    constructor(restClient, DB, options) {
        if (options) {
            this.setOptions(options);
        }
        this.data = [];
        this.members = [];
        this._restClient = restClient;
        this._db = DB;
    }
    setOptions(options, key) {
        this.uuid = options.uuid;
        this.uniqueName = options.uniqueName;
        this.name = options.name;
        this.createdAt = options.createdAt;
        this.updatedAt = options.updatedAt;
        for (let x in options.data) {
            this.data.push(new KeyRingData_1.default(options.data[x]));
        }
        let members = [];
        for (let x in options.members) {
            if (options.members[x].role === 'master') {
                if (key) {
                    options.members[x].Member.keys[0].data = key;
                    this._master = new Member_1.default(options.members[x].Member, this._db, this);
                }
                else {
                    this._master = new Member_1.default(options.members[x].Member, this._db, this);
                }
            }
            else {
                members.push(options.members[x].Member);
            }
        }
        for (let i in members) {
            this.members.push(new Member_1.default(members[i], this._db, this, this._master));
        }
        this.enableMemberStorage();
    }
    create(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyRing = yield this._restClient.post('/kmf/ring', { ring_name: name });
            this.setOptions(keyRing.data.keyRing, keyRing.data.key);
            return this;
        });
    }
    load(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyRing = yield this._restClient.get(`/kmf/ring/${uuid}`);
            this.setOptions(keyRing.data);
            return this;
        });
    }
    getMember(nameOrUUID) {
        if (this.members.length === 0) {
            throw new Error('Key ring has no members');
        }
        else {
            for (let x in this.members) {
                if (this.members[x].uuid === nameOrUUID || this.members[x].name === nameOrUUID) {
                    return this.members[x];
                }
            }
        }
    }
    addMember(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let x in this.members) {
                if (this.members[x].name === data.name) {
                    return this.members[x];
                }
            }
            const result = yield this._restClient.post('/kmf/ring/' + this.uuid + '/member/add', data);
            let member;
            if (result.status === 200) {
                member = new Member_1.default(result.data.member.Member, this._db, this, this._master);
                member.save = this._storage.save;
                member.delete = this._storage.delete;
                this.members.push(member);
            }
            else {
                throw new Error(result.statusText);
            }
            return member;
        });
    }
    delMember(nameOrUUID) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.members.length === 0) {
                throw new Error('Key ring has no members');
            }
            else {
                let members = [];
                for (let x in this.members) {
                    if (this.members[x].uuid === nameOrUUID || this.members[x].name === nameOrUUID) {
                        yield this._restClient.del('/kmf/ring/' + this.uuid + '/member/' + this.members[x].uuid);
                        this.members[x].destroy().then(() => {
                            console.log(`Successfully removed ${nameOrUUID} from the key ring`);
                        }).catch((err) => console.error(`Unable to remove ${nameOrUUID} from the key ring:`, err));
                    }
                    else {
                        members.push(this.members[x]);
                    }
                }
                this.members = members;
            }
        });
    }
    getData(nameOrUUID) {
        if (this.data.length === 0) {
            throw new Error('Key ring has no data');
        }
        else {
            for (let x in this.data) {
                if (this.data[x].uuid === nameOrUUID || this.data[x].name === nameOrUUID) {
                    return this.data[x];
                }
            }
        }
    }
    addData(request) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let x in this.data) {
                if (this.data[x].name === request.name) {
                    return this.data[x];
                }
            }
            const result = yield this._restClient.post('/kmf/ring/' + this.uuid + '/data/add', request);
            let data;
            if (result.status === 200) {
                data = new KeyRingData_1.default(result.data.ringData);
                this.data.push(data);
                return data;
            }
            else {
                throw new Error(result.statusText);
            }
        });
    }
    updateData(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this._restClient.put('/kmf/ring/' + this.uuid + '/data/' + request.uuid, request);
            let dataResponse;
            if (result.status === 200) {
                let data = [];
                for (let x in this.data) {
                    if (this.data[x].uuid === request.uuid) {
                        data.push(this.data[x]);
                    }
                }
                dataResponse = new KeyRingData_1.default(result.data.ringData);
                data.push(dataResponse);
                this.data = data;
                return data;
            }
            else {
                throw new Error(result.statusText);
            }
        });
    }
    delData(nameOrUUID) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.data.length === 0) {
                throw new Error('Key ring has no members');
            }
            else {
                let data = [];
                for (let x in this.data) {
                    if (this.data[x].uuid === nameOrUUID || this.data[x].name === nameOrUUID) {
                        yield this._restClient.del('/kmf/ring/' + this.uuid + '/data/' + this.data[x].uuid);
                    }
                    else {
                        data.push(this.data[x]);
                    }
                }
                this.data = data;
            }
        });
    }
    enableMemberStorage() {
        if (this.members.length > 0) {
            for (let x in this.members) {
                this.members[x].save = this._storage.save;
                this.members[x].delete = this._storage.delete;
            }
        }
    }
    set storage(storage) {
        this._storage = storage;
        this.enableMemberStorage();
    }
    get storage() {
        return this._storage;
    }
}
exports.default = KeyRing;
//# sourceMappingURL=KeyRing.js.map