import { PsbtInput } from 'bip174/src/lib/interfaces';
import { BIP32Interface } from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoinjs from 'bitcoinjs-lib';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371';
import { Base43 } from './base43';
import { Bip32Utils } from './bip32.utils';
import { Mnemonic } from './mnemonic';

export class Psbt {

    object: bitcoinjs.Psbt;
    signedTransaction: string;

    static fromBase64(base64: string, network: bitcoinjs.Network) {
        const instance = new Psbt();
        instance.object = bitcoinjs.Psbt.fromBase64(base64, { network: network });
        return instance;
    }

    static fromBase43(base43: string, network: bitcoinjs.Network) {
        const decoded = Base43.decode(base43);
        const instance = new Psbt();
        instance.object = bitcoinjs.Psbt.fromBuffer(Buffer.from(decoded), { network: network });
        return instance;
    }

    sign(mnemonic: Mnemonic) {
        const seed = bip39.mnemonicToSeedSync(mnemonic.phrase, mnemonic.passphrase);
        const hdRoot = Bip32Utils.instance.fromSeed(seed);
        this.signIndependently(hdRoot);
        this.object.finalizeAllInputs();
        this.signedTransaction = this.object.extractTransaction().toHex();
    }

    signAll(hdRoot: BIP32Interface) {
        this.object.signAllInputsHD(hdRoot);
    }

    signIndependently(hdRoot: BIP32Interface) {
        for (let i = 0; i < this.object.txInputs.length; i++) {
            const path = this.firstBip32Derivation(this.object.data.inputs[i]).path;
            const purpose = parseInt(path.split('/')[1].replace("'", ''));
            let signerNode = hdRoot.derivePath(path);
            let signer: bitcoinjs.Signer;
            if (purpose === 86) {
                const childNodeXOnlyPubkey = toXOnly(signerNode.publicKey);
                signer = signerNode.tweak(
                    bitcoinjs.crypto.taggedHash('TapTweak', childNodeXOnlyPubkey),
                );
            } else {
                signer = signerNode;
            }
            this.object.signInput(i, signer);
        }
    }

    firstBip32Derivation(psbtInput: PsbtInput) {
        if (psbtInput.tapBip32Derivation) {
            return psbtInput.tapBip32Derivation[0];
        }
        return psbtInput.bip32Derivation[0];
    }

}
