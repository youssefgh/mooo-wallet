
export class Derived {

    address: string
    purpose: number
    coinType: number
    account: number
    change: number
    index: number
    masterFingerprint: Buffer
    publicKey: Buffer

    path() {
        return "m/" + this.purpose + "'/" + this.coinType + "'/" + this.account + "'/" + this.change + "/" + this.index
    }

    bip32Derivation() {
        if (!this.masterFingerprint) {
            // dummy masterFingerprint
            this.masterFingerprint = Buffer.from("FFFFFFFF", 'hex')
        }
        return {
            masterFingerprint: this.masterFingerprint,
            pubkey: this.publicKey,
            path: this.path()
        }
    }

}