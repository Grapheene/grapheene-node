"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializer = void 0;
const { Grapheene } = require('./lib/Grapheene');
const initializer = function (uuid, apiKey, opts) {
    return new Grapheene(uuid, apiKey, opts);
};
exports.initializer = initializer;
exports.initializer.Grapheene = Grapheene;
module.exports = exports.initializer;
//# sourceMappingURL=index.js.map