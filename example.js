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

// Field level for an object
/*
// ENCRYPTION
const TicketingSystem = new TicketingSystem();
const Grapheene = require('./dist')('US34552ba2262d4dc0ac2268f82f4ede23', 'SK4d1286e70fe3408fa8c10430b293d946');

Grapheene.kmf.ring.create('keyRingName|DM_MESSAGE_ID')
    .then(async (ring) => {
        const sarmad = await ring.addMember({
            name: 'sarmad@grapheene.net'
        });
        const william = await ring.addMember({
            name: 'william@grapheene.net'
        });
        console.log('Members created');
        // This looks up the master key in SQlite and returns then encrypts the data
        const ticket = TicketingSystem.helpTicket();
        ticket.summary = 'Some new help ticket';
        for (let x in ticket) {
            ticket[x] = await sarmad.data().encrypt(ticket.summary, ticket.id + `_${x}`);
            console.log(result);
            /*
            KeyRingData {
                uuid: 'RD76252972266C474B8B22F2E74819890D',
                name: '1234_summary',
                path: 'in:memory',
                service: 'unsaved'
            }

             */
/*
        }
        TicketingSystem.helpTicket().save();

    }).catch((e) => {
    console.log(e.message);
});
/*
// DECRYPTION
const TicketingSystem = new TicketingSystem();
const Grapheene = require('./dist')('US34552ba2262d4dc0ac2268f82f4ede23', 'SK4d1286e70fe3408fa8c10430b293d946');

Grapheene.kmf.ring.create('keyRingName|DM_MESSAGE_ID')
    .then(async (ring) => {
        const member = await ring.addMember({
            name: TicketingSystem.helpTicket().user()
        });
        // This looks up the master key in SQlite and returns then encrypts the data
        const ticket = TicketingSystem.helpTicket();
        ticket.summary = 'aslfhpakjfhaskjf;ghask;fjhasdk;fjhnask;dfn';
        for (let x in ticket) {
            ticket[x] = await member.data().decrypt(ticket.summary);

        }
        TicketingSystem.helpTicket().display();

    }).catch((e) => {
    console.log(e.message);
});

// Field level

// ENCRYPTION / classic method for key rotation is very hard
const Slack = new Slack();
const Grapheene = require('./dist')('US34552ba2262d4dc0ac2268f82f4ede23', 'SK4d1286e70fe3408fa8c10430b293d946');

// WHEN THE DM GROUP IS CREATED
Grapheene.kmf.ring.create('DM_GROUP_ID+MESSAGE_ID')
    .then(async (ring) => {
        let members = [];
        for (let i in Slack.members) {
            members.push(await ring.addMember({
                name: Slack.members[i].USER_ID
            }));
        }
        console.log('Members created');
    }).catch((e) => {
    console.log(e.message);
});

// SEND MESSAGE
Grapheene.kmf.ring.create('DM_GROUP_ID+MESSAGE_ID')
    .then(async (ring) => {

        Slack.message = 'Some new help ticket';
        const member = ring.getMember(Slack.members[i].USER_ID);
        Slack.message = await member.data().encrypt(DM_GROUP_ID+MESSAGE_ID + `_${Slack.message}`+'@@@@'+Slack.message, DM_GROUP_ID+MESSAGE_ID + `_${Slack.message}`);

        Slack.message.send();

    }).catch((e) => {
    console.log(e.message);
});

// DECRYPTION Chrome Extenstion
const Slack = new Slack();
const Grapheene = require('./dist')('US34552ba2262d4dc0ac2268f82f4ede23', 'SK4d1286e70fe3408fa8c10430b293d946');

Grapheene.kmf.ring.create('DM_GROUP_ID+MESSAGE_ID')
    .then(async (ring) => {
        const elements = DOM.find('.message_classic')
        for(let x in elements){

        }

    }).catch((e) => {
    console.log(e.message);
});


//GDPR ENDPOINT
// DELETE host/gdpr/matt@grapheene.net

// All the data that folks had access to
const data: Array<rows> = 'SELECT ServiceName, DATA_NAME, DATA, USER FROM TABLE WHERE USER=matt@grapheene.net'

// Everyone that had access to the data
const user: Array<rows> = 'SELECT USER FROM TABLE WHERE USER=matt@grapheene.net'

for(let x in data){
    Grapheene.kmf.ring.create('ServiceName' | 'ServiceName_DATA_NAME')
        .then(async (ring) => {
                for(let i in ring.members){
                    ring.delMember(ring.members[i])
                }
                -> ring.rotate()

        }).catch((e) => {
        console.log(e.message);
    });
}
*/
//process.env.DATABASE_URL='mongodb+srv://user:fR1mIhFLnYWXSxya@cluster0.vpyrv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
process.env.DATABASE_URL="postgresql://db_user:password@localhost:6432/keystore?schema=public"

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
        const encrypted = await sarmad.file().encrypt('/home/matt/WebstormProjects/grapheene/grapheene-node/somefolder/atextfile.txt');
        console.log('Encrypted: ', encrypted);
        // This looks up the members public key in SQlite and returns then decrypts the data
        await ring.storage.cloud().save(encrypted);

        setTimeout(async () => {
            await ring.delMember('sarmad@grapheene.net');
            console.log('Deleted \'sarmad@grapheene.net\'');
            await ring.delMember('william@grapheene.net');
        }, 10000);
    }).catch((e) => {
    console.log(e.message);
});

/*

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
