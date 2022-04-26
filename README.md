# grapheene-node

A Grapheene SDK for NodeJS

For documentation on the SDK please visie [docs.grapheene.com](https://docs.grapheene.com)

## What is Grapheene?

Grapheene is an *SDK* for your application augmented with cryptographic cloud services. With Grapheene and a few lines of code, you can encrypt and decrypt any type of data – like a message or a post, an image, the content of a form field, PII or personal health information.

Using Grapheene’s modern encryption services you can protect your application data, whether *in-transit* or *at-rest*, on the server side or end-to-end between client devices.

Grapheene can be used to comply with user privacy laws like GDPR and CCPA or to protect your data if an attacker gains access to your systems or backup files.

Using Keyring Members, you can easily and programmatically manage who – or what object in your code – can access the encrypted data. This is great for code reviews where you can clearly see the entity trying to decrypt data.

The Grapheene architecture is designed to leverage your local runtime to perform certain tasks and assist them from the cloud.

With Grapheene you can reach the goal of data security even if there is an unwanted system or cloud leak. This is the power of a well designed encryption system.

## Getting Started

Getting started with Grapheene is quick and easy! In just a few steps you can protect your application with Grapheene's industry leading Zero Knoweldge authentication  and AES256 encryption.

### References

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

![Dashboard Example](assets/cred_example.png)
