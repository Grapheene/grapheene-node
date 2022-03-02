const {Grapheene} = require('./lib/Grapheene')

export const initializer = function (uuid: string, apiKey: string, token: string, opts?: any) {
    return new Grapheene(uuid, apiKey, token, opts);
};


initializer.Grapheene = Grapheene;

module.exports = initializer
