const path = require('path');
let dir = path.dirname(require.main.filename || process.mainModule.filename);

const Grapheene = require('./dist')('US34552ba2262d4dc0ac2268f82f4ede23', 'SK4d1286e70fe3408fa8c10430b293d946');

Grapheene.kms.generate()
    .then((keys) => {
        console.log('Keys: ', keys);
        const myDir = dir + '/just_playing';
        console.log('What we will encrypt: ', myDir);
        Grapheene.save(myDir + '/keys.json', JSON.stringify(keys));
        Grapheene.crypto.encrypt(myDir, keys)
            .then(async (encrypted) => {
                console.log('Encrypted Path: ','\n', encrypted);
                Grapheene.save(myDir + '/encrypted', encrypted);
                const decrypted = await Grapheene.crypto.decrypt(encrypted, keys);
                console.log('\n','Decrypted Path: ', decrypted);
            });
    })
    .catch(console.log);
/*
// File is the path to the data we want to encrypt
Graph.encrypt().save();

// query is either a cloud query or a path to a local file
const query = 'some/path || a query';
Graph.decrypt(query);

// Invoke KMS to get new client id and api token (available to owner and admin level)
Graph.kms().newClient();
*/
