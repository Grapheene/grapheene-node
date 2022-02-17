# grapheene-node

A Grapheene SDK for NodeJS

For documentation on the SDK please visie [docs.grapheene.com](https://docs.grapheene.com)

## What is Grapheene?

Using Grapheene and a few lines of code you can protect your application data with modern encryption, whether *in-transit* or  *at-rest* , on the server side or end-to-end between client devices.
This can be useful to comply with user privacy laws like GDPR and CCPA or to prevent data leak in case of an attacker gaining access to your systems or backup files.

It’s an *SDK* for your application augmented with cryptographic *cloud* services. With a few lines of code, you can encrypt and decrypt any type of data – like a message or a post, an image, the content of a form field, PII or personal health information.

Using Keyring Members, you can easily manage who – or what object in your code – can access the data, easily and programmatically. This is great for code reviews where you can clearly see the entity trying to decrypt data.

The Grapheene architecture is designed to leverage your local runtime to perform certain tasks and assist them from the cloud.

The goal is to keep your data secure even if there is an unwanted leak from your systems or from the Grapheene cloud. This is the power of a well designed encryption system.

## Getting Started

Getting started with Grapheene is quick and easy! In just a few steps you can protect your application with Grapheene's industry leading Zero Knoweldge authentication  and AES256 encryption.

### Refrences

Grapheene Dashboard [https://dashboard.grapheene.com/](https://dashboard.grapheene.com/)

Grapheene API and SDK documentation [https://docs.grapheene.com/](https://docs.grapheene.com/)

NodeJS [https://nodejs.dev/learn/how-to-install-nodejs](https://nodejs.dev/learn/how-to-install-nodejs)


### Prerequisite

1. NodeJS v15 or higher is required for Grapheene SDK, find the installation instrucitons for your systems lates LTS [here](https://nodejs.dev/learn/how-to-install-nodejs)
2. An account with [Grapheene](https://dashboard.grapheene.com/login), a free account will work

### Installation

```
npm i @grapheene/grapheene
```

### Configuration

The Grapheene SDK requires a thre part credential system to get started.

* CLIENT_ID: This ID is a service level credential.
* API_KEY: This Key is a service level credential.
* SERVICE_TOKEN: This Token is an account level credential.

Your Client ID and API Key pair is a service level credential and a new pair should be used with each service you create.

The Service Token is an account level credential, if necessary this credential can be rotated if you believe it has been compromised.

All credentials are accessible from the [Grapheene Dashboard](https://dashboard.grapheene.com)

![Dashboard Example](https://grapheene-public-assets.s3.us-west-2.amazonaws.com/Selection_096.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEJP%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMSJHMEUCIQCs1mxvU%2B14KHTquqHPo8GYTkEUp4Yt5D3WqVfmabxRMwIgKnQjfFBn6g3gBlpGx0mPGsrh5rWS1chVonARy0VWJJIqhAMI3P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARACGgw3MTE4ODYzODExNzIiDL9%2FMOnaXCkmNkQ05SrYAodwHCQkAnNFpn9VQzZDtzpAAbOeQSnXAJ%2BGAc0f7ZMdslKl8YX3an3qPRP0z40IX98yUcR1bNFpv3fnEa0mE%2BF2%2FnuQCuSOEDoEYY2AsD%2BMKUv57KPGmAin8NmgvQZ6HWLOyzWYNnqN7cUxiMb82Fh77u3e256A0hnhM6MdI9irVRtI5bSNIrKKhSP8sImzo3t8NwzX7BNZmAuhYby2NTiWQhpHBl5lXKzUnNb8G2z5VbBPk2en0vqdnoSCw8BqiiouobytlT95NTdi0NKstz%2Ba9XPjZDDhQZ49o0ge%2BNUynaZC1sE7RU%2FhxJ12wx8zDxg5ZDwd7RHi%2BTBjGhwUkq2gbBTIlBuFskFi6sCWs2ly%2BRp67v6V7NFXMkbivfz4HXPZCgxHMMb3NHP8Jgr8Aw8ZngqsRoi4oIeGWjM7n%2FMBAtwoo%2B33WP5q78%2BLIsIDk1pigqzVEKJgMNmsupAGOrMCIUasFZADQp%2BkkHqHeXXr74A1BVGgh8gOuci0E7pa1QYQAgsQuggDyKmZ4LKgOfG4m%2BpNfQgF9QwpfSoeRZnqa9jSjhOjVSkou2FuVyuWLUpmQdKlTfvauShUGfrNqhH6AqLXq9ANLyCfDfcvPhhRSFoxsb87Xmt0zkVMt31Y5AWvKqBCuOCUpn%2Be6d0DSO9xrYuBCv7X9RhbbZG%2BSWZFnDYr5B1Y%2Fp3EwuPV0DSn%2BlQvkSAkzkwEXMBZe9I%2FtDg6%2FuqZc1zggrKlHw218q%2BNTW2Jh5eo2zm49swT9OzsziU5O29CLMSMe9d9QGAgCf7vYeyoacROp%2FMNQiGO%2BGk%2BxR3LeVkRJj%2FJPgxtBM5Cc2nR0WfAY8FHwUIjUr66%2FIBkInpNGDAA4qb1bpFWdskGbc9nfA%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20220217T184358Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIA2LP54EB2AGYYDGUE%2F20220217%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Signature=9de0f327e32d8d9db14cb289108403b7ebaf9b09d4c9c43fc5ef8e74f28734a4)


### My First Grapheene Application

It is time to perform your first encryption with Grapheene! The code snippet below is all you need to get started. 

Replace your credentials with the appropriate ones.

```javascript
const Grapheene = require('@grapheene/grapheene')('CLIENT_ID', 'API_KEY', 'SERVICE_TOKEN');
Grapheene.setup().then(() => {
    Grapheene.kmf.ring.create('My New Key Ring')
        .then(async (ring) => {
            const member = await ring.addMember({
                name: `user@grapheene.net`
            })
            const encrypted = await member.data().encrypt('Some data content', 'myContentName');
            console.log('Encrypted: ', encrypted);
            const decrypted = await member.data().decrypt(encrypted);
            console.log('Decrypted: ', decrypted);
        }).catch((e) => {
        console.log(e.message);
    });
})
```

What should we expect to see?

```javascript
Encrypted:  {
  name: 'myContentName',
  path: 'in:memory',
  encrypted: 'oWCÝ\x01ç\x81½(Ãî0\x82oä5²\x8E;Ã¦«Â\x06X¢>gß¿«\x1AÕ¼k\b¡X£X\x03È\x7FhÃ,Á#8oÍtP\x07e\x83,»\x05´f\x055w]',
  service: 'unsaved'
}
Decrypted:  {
  name: 'myContentName',
  path: 'in:memory',
  encrypted: 'oWCÝ\x01ç\x81½(Ãî0\x82oä5²\x8E;Ã¦«Â\x06X¢>gß¿«\x1AÕ¼k\b¡X£X\x03È\x7FhÃ,Á#8oÍtP\x07e\x83,»\x05´f\x055w]',
  service: 'unsaved',
  decrypted: 'Some data content'
}

```

Wasn't that easy!!
