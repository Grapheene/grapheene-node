import { ab2str, AESKey, ECDHKeyPair, HMAC } from "./"
import KeyStore from './KeyStore'

export default class KeyManagement {
  static privateKey: any = null
  static secretKey: any = null

  static async generateAndExportKeyPair() {
    //console.log('TEST1')
    let keyPair = await ECDHKeyPair.generate()
    //console.log('TEST2')
    let privateKey = await keyPair.exportPrivateKey()
    //console.log('TEST3')
    let publicKey = await keyPair.exportPublicKey()
    //console.log('TEST4')
    return [privateKey, publicKey]
  }

  static async decryptRawKey(rawKey: any, password: any) {
    let decryptionKey = new AESKey({ password })
    let key = await decryptionKey.decrypt(rawKey)
    if (!key) {
      return null
    }
    return ab2str(key)
  }

  static async encryptRawKey(rawKey: any, password: any) {
    let encryptionKey = new AESKey({ password })
    let key = await encryptionKey.encrypt(rawKey)
    if (!key) {
      return null
    }
    return ab2str(key)
  }

  static async decryptPrivateKey(password: any) {
    let decryptionKey = new AESKey({ password })
    if (KeyStore.isEncrypted('privateKey')) {
      let key = await decryptionKey.decrypt(KeyStore.privateKey)
      if (!key) {
        return false
      }
      KeyStore.setPrivateKey(ab2str(key), false)
      return true
    } else {
      return false
    }
  }

  static async hmacSign(msg: any) {
    let h = new HMAC(KeyStore.HMAC)
    return h.sign(msg)
  }

  static async decryptSecretKey(password: any) {
    let decryptionKey = new AESKey({ password })
    if (KeyStore.isEncrypted('secretKey')) {
      let key = await decryptionKey.decrypt(KeyStore.secretKey)
      if (!key) {
        return false
      }

      KeyStore.setSecretKey(ab2str(key), false)
      return true
    } else {
      return false
    }
  }

  static async decryptHMAC(password: any) {
    let decryptionKey = new AESKey({ password })
    if (KeyStore.isEncrypted('hmac')) {
      let key = await decryptionKey.decrypt(KeyStore.secretKey)
      if (!key) {
        return false
      }

      KeyStore.setHMAC(ab2str(key), false)
      return true
    } else {
      return false
    }
  }

  static generateRandomKey() {
    const usedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#_+=!$%&¡-'
    let keyArray = new Uint8Array(16)
    crypto.getRandomValues(keyArray)
    keyArray = keyArray.map(x => usedChars.charCodeAt(x % usedChars.length))
    const randomizedKey = String.fromCharCode.apply(null, keyArray)
    return randomizedKey
  }

  static get keysLoaded() {
    return KeyStore.privateKey != null && KeyStore.secretKey != null && KeyStore.publicKey != null && KeyStore.HMAC != null
  }

  static get keysEncrypted() {
    return KeyStore.isEncrypted('privateKey') ||
      KeyStore.isEncrypted('secretKey') ||
      KeyStore.isEncrypted('hmac')
  }
}
