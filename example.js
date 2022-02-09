const path = require('path');
let dir = path.dirname(require.main.filename || process.mainModule.filename);

/*
Grapheene.kms.generate()
    .then((keys) => {
        console.log('Keys: ', keys);
        const myDir = dir + '/just_playing';
        console.log('What we will encrypt: ', myDir);
        Grapheene.save(myDir + '/keys.json', JSON.stringify(keys));
        Grapheene.crypto.encrypt(myDir, keys)
            .then(async (encrypted) => {
                console.log('Encrypted Path: ', '\n', encrypted);
                Grapheene.save(myDir + '/encrypted', encrypted);
                const decrypted = await Grapheene.crypto.decrypt(encrypted, keys);
                console.log('\n', 'Decrypted Path: ', decrypted);
            });
    })

Creates a new key ring,
Creates a ring "master key",
Mints public key for owner(member that created it),


MasterKey <- // This mints all public keys for members and encrypts the data
Members   <- // Members have their own public keys

if we rotate....

We create a new master key,
We mint public keys for all members,
Re-encrypt data with new master key

How do we decrypt during a rotation

Join a keyring,
We attempt to decrypt with one key,
If that fails we try the other key

Decrypt Data

Join a keyring
We attempt to decrypt with key

Encrypt Data

Join a keyring
We attempt to decrypt with key

const Grapheene = new Grapheene({ClientID, OktaAPIKey, SDKKey})


 */
// const Grapheene = require('./dist')('US34552ba2262d4dc0ac2268f82f4ede23', 'SK4d1286e70fe3408fa8c10430b293d946', 'OKTA-API-KEY');
const Grapheene = require('./dist')('US34552ba2262d4dc0ac2268f82f4ede23', 'SK4d1286e70fe3408fa8c10430b293d946');

Grapheene.kmf.ring.create('keyRingName')
    .then(async (ring) => {
        const sarmad = await ring.addMember({
            name: 'sarmad@grapheene.net'
        });
        const william = await ring.addMember({
            name: 'william@grapheene.net'
        });
        console.log('Members created');
        // This looks up the master key in SQlite and returns then encrypts the data
        const result = await sarmad.file().encrypt('/home/matt/WebstormProjects/grapheene/grapheene-node/somefolder/atextfile.txt');
        await ring.storage.cloud().save(result)
        /*
        setTimeout(async () => {
            await sarmad.file().decrypt(result);
        }, 5000);

         */

    }).catch((e) => {
    console.log(e.message);
});

/*
Grapheene.kmf.ring.create('keyRingName')
    .then(async (ring) => {
        const sarmad = await ring.addMember({
            name: 'sarmad@grapheene.net'
        });
        const william = await ring.addMember({
            name: 'william@grapheene.net'
        });
        console.log('Members created');
        // This looks up the master key in SQlite and returns then encrypts the data
        const encrypted = await sarmad.data().encrypt('somedata');
        console.log('Encrypted: ', encrypted);
        // This looks up the members public key in SQlite and returns then decrypts the data
        await ring.storage.save(dir+'/somefolder', 'some.txt', encrypted);
        const decrypted = await william.data().decrypt(encrypted);
        ring.storage.list();
        const file = ring.storage.find('some.txt');
        console.log(file);
        await ring.storage.delete(file)
        console.log('Decrypted: ', decrypted);

        setTimeout(async () => {
            await ring.delMember('sarmad@grapheene.net');
            console.log('Deleted \'sarmad@grapheene.net\'');
            await ring.delMember('william@grapheene.net');
        }, 10000);
    }).catch((e) => {
    console.log(e.message);
});



const Grapheene = require('./dist')('US34552ba2262d4dc0ac2268f82f4ede23', 'SK4d1286e70fe3408fa8c10430b293d946');
Grapheene.kmf.ring.create('keyRingName')
    .then(async (ring) => {
       await ring.addMember({
            name: 'sarmad@grapheene.net'
        });
        console.log(ring.members)
    }).catch((e)=>{
    console.log(e.message)
})
/*

Grapheene.ring.get('channelName | channelId')
   .then((ring) => {

       const member = ring.getMember({
           uniqueName: 'sarmad@grapheene.net',
       });
       const somedata = Grapheene.storage.load('uniqueFileName')
       const decrypted = member.decrypt(somedata);
   });

Grapheene.ring.get('channelName | channelId')
   .then((ring) => {

       const member = ring.getMember({
           uniqueName: 'someName'
       });

       const data = member.encrypt('somedata');0
       /*
       data = {
           keyring,
           data,
           ...metaData
       }

       // fs.writeFileSync - wraps up saving makes it easy for the customer
       Grapheene.storage.save('uniqueName', 'path', data)
   });


*/
/*
// File is the path to the data we want to encrypt
Graph.encrypt().save();

// query is either a cloud query or a path to a local file
const query = 'some/path || a query';
Graph.decrypt(query);

// Invoke KMS to get new client id and api token (available to owner and admin level)
Graph.kms().newClient();
*/
