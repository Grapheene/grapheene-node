"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KMF = void 0;
const KeyRing_1 = require("./KeyRing");
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
}
exports.KMF = KMF;
//# sourceMappingURL=KMF.js.map