import { Bip32Derivation, TapBip32Derivation } from 'bip174/src/lib/interfaces';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371';
import { Address } from './address';

export class Derived {

    address: Address;
    purpose: number;
    coinType: number;
    account: number;
    change: number;
    index: number;
    masterFingerprint: Buffer;
    publicKey: Buffer;

    path() {
        return 'm/' + this.purpose + '\'/' + this.coinType + '\'/' + this.account + '\'/' + this.change + '/' + this.index;
    }

    bip32Derivation(): Bip32Derivation {
        if (!this.masterFingerprint) {
            // dummy masterFingerprint
            this.masterFingerprint = Buffer.from('FFFFFFFF', 'hex');
        }
        return {
            masterFingerprint: this.masterFingerprint,
            pubkey: this.publicKey,
            path: this.path(),
        };
    }

    tapBip32Derivation(tapInternalKey?: Buffer): TapBip32Derivation {
        if (!tapInternalKey) {
            tapInternalKey = this.tapInternalKey();
        }
        if (!this.masterFingerprint) {
            // dummy masterFingerprint
            this.masterFingerprint = Buffer.from('FFFFFFFF', 'hex');
        }
        return {
            masterFingerprint: this.masterFingerprint,
            pubkey: tapInternalKey,
            path: this.path(),
            leafHashes: [],
        };
    }

    tapInternalKey() {
        return toXOnly(this.publicKey);
    }

}
