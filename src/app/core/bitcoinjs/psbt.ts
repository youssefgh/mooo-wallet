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

    sign(mnemonic: Mnemonic): SignResult {
        let signedTransaction: string;
        let psbtBase64: string;
        const seed = bip39.mnemonicToSeedSync(mnemonic.phrase, mnemonic.passphrase);
        const hdRoot = Bip32Utils.instance.fromSeed(seed);
        const signResult = this.signIndependently(hdRoot);
        if (signResult.signedCount === 0) {
            return null;
        }
        if (signResult.finalizedInputsCount === this.object.txInputs.length) {
            signedTransaction = this.object.extractTransaction().toHex();

        } else {
            psbtBase64 = this.object.toBase64();
        }
        return { signedTransaction, psbtBase64 };
    }

    signIndependently(hdRoot: BIP32Interface) {
        let signedCount = 0;
        let finalizedInputsCount = 0;
        for (let i = 0; i < this.object.txInputs.length; i++) {
            const input = this.object.data.inputs[i];
            const bip32DerivationList = this.bip32Derivation(input);
            let treshold: number;
            if (bip32DerivationList.length > 1) {
                const p2ms = bitcoinjs.payments.p2ms({ output: input.witnessScript });
                treshold = p2ms.m;
            }
            for (const bip32Derivation of bip32DerivationList) {
                if (treshold && input.partialSig?.length === treshold) {
                    if (!input.finalScriptSig && !input.finalScriptWitness) {
                        this.object.finalizeInput(i);
                        finalizedInputsCount++;
                    }
                    break;
                }
                if (hdRoot.fingerprint.equals(bip32Derivation.masterFingerprint)) {
                    const path = bip32Derivation.path;
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
                    signedCount++;
                    if (!treshold) {
                        this.object.finalizeInput(i);
                        finalizedInputsCount++;
                    }
                }
            }
        }
        return { signedCount, finalizedInputsCount };
    }

    bip32Derivation(psbtInput: PsbtInput) {
        if (psbtInput.tapBip32Derivation) {
            return psbtInput.tapBip32Derivation;
        }
        return psbtInput.bip32Derivation;
    }

}

export interface SignResult {
    signedTransaction: string;
    psbtBase64: string;
}