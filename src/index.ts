const {Grapheene} = require('./lib/Grapheene')

export const initializer = function (uuid: string, apiKey: string, opts?: any) {

    return new Grapheene(uuid, apiKey, opts);
};


initializer.Grapheene = Grapheene;

module.exports = initializer
