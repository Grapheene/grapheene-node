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
exports.KMF = void 0;
const KeyRing_1 = __importDefault(require("./KeyRing"));
class KMF {
    constructor(RestClient, DB) {
        this._restClient = RestClient;
        this._db = DB;
        this.ring = new KeyRing_1.default(this._restClient, this._db);
    }
    set ring(keyRing) {
        this._ring = keyRing;
    }
    get ring() {
        return this._ring;
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this._restClient.del('/kmf/ring/' + this._ring.uuid);
            this.ring = null;
            return result;
        });
    }
}
exports.KMF = KMF;
//# sourceMappingURL=KMF.js.map