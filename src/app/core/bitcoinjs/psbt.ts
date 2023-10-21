import { PsbtInput, TapBip32Derivation } from 'bip174/src/lib/interfaces';
import { BIP32Interface } from 'bip32';
import * as bitcoinjs from 'bitcoinjs-lib';
import { rootHashFromPath, tapleafHash } from 'bitcoinjs-lib/src/payments/bip341';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371';
import { Base43 } from './base43';
import { HdRoot } from './hd-root';
import { Mnemonic } from './mnemonic';

export class Psbt {

    object: bitcoinjs.Psbt;
    network: bitcoinjs.Network;

    static fromBase64(base64: string, network: bitcoinjs.Network) {
        const instance = new Psbt();
        instance.object = bitcoinjs.Psbt.fromBase64(base64, { network: network });
        instance.network = network;
        return instance;
    }

    static fromBase43(base43: string, network: bitcoinjs.Network) {
        const decoded = Base43.decode(base43);
        const instance = new Psbt();
        instance.object = bitcoinjs.Psbt.fromBuffer(Buffer.from(decoded), { network: network });
        instance.network = network;
        return instance;
    }

    sign(mnemonic: Mnemonic): SignResult {
        let signedTransaction: string;
        let psbtBase64: string;
        const hdRoot = HdRoot.from(mnemonic, this.network);
        const signResult = this.signIndependently(hdRoot);
        if (signResult.signedInputCount > 0) {
            if (signResult.finalizedInputCount === this.object.txInputs.length) {
                signedTransaction = this.object.extractTransaction().toHex();
            } else {
                psbtBase64 = this.object.toBase64();
            }
        }
        return { signedTransaction, psbtBase64, signatureCount: signResult.signatureCount, threshold: signResult.threshold };
    }

    signIndependently(hdRoot: BIP32Interface) {
        let signedInputCount = 0;
        let finalizedInputCount = 0;
        let globalThreshold: number;
        let globalSignatureCount: number;
        for (let i = 0; i < this.object.txInputs.length; i++) {
            const input = this.object.data.inputs[i];
            let bip32DerivationList = this.bip32Derivation(input);
            let isWshMutisig = false;
            let isTrMutisig = false;
            let threshold: number;
            let publicKeyCount: number;
            let inputLeafHash: Buffer;
            if (input.bip32Derivation?.length > 1) {
                const p2ms = bitcoinjs.payments.p2ms({ output: input.witnessScript });
                threshold = p2ms.m;
                isWshMutisig = true;
            } else if (input.tapBip32Derivation?.length > 1) {
                const chunks = bitcoinjs.script.decompile(input.tapLeafScript[0].script);
                threshold = chunks[chunks.length - 2] as number - bitcoinjs.script.OPS.OP_RESERVED;
                publicKeyCount = bip32DerivationList.length - 1;
                isTrMutisig = true;
            }
            if (isTrMutisig) {
                bip32DerivationList = bip32DerivationList.slice().sort((d1, d2) => {
                    if ((d1 as TapBip32Derivation).leafHashes?.length > (d2 as TapBip32Derivation).leafHashes?.length) {
                        return 1;
                    }
                    return -1;
                }
                );
            }
            for (const bip32Derivation of bip32DerivationList) {
                if (this.isMultisigSignatureComplete(isTrMutisig, isWshMutisig, threshold, publicKeyCount, input)) {
                    this.object.finalizeInput(i);
                    finalizedInputCount++;
                    break;
                }
                if (hdRoot.fingerprint.equals(bip32Derivation.masterFingerprint)) {
                    const path = bip32Derivation.path;
                    let signerNode = hdRoot.derivePath(path);
                    let signer: bitcoinjs.Signer;
                    if ((bip32Derivation as TapBip32Derivation).leafHashes) {
                        const childNodeXOnlyPubkey = toXOnly(signerNode.publicKey);
                        if (input.tapBip32Derivation?.length === 1) {
                            signer = signerNode.tweak(
                                bitcoinjs.crypto.taggedHash('TapTweak', childNodeXOnlyPubkey),
                            );
                        } else if ((bip32Derivation as TapBip32Derivation).leafHashes.length === 0) {
                            const leafHash = tapleafHash({
                                output: input.tapLeafScript[0].script,
                                version: input.tapLeafScript[0].leafVersion,
                            });
                            const rootHash = rootHashFromPath(input.tapLeafScript[0].controlBlock, leafHash);

                            signer = signerNode.tweak(
                                bitcoinjs.crypto.taggedHash('TapTweak', Buffer.concat([childNodeXOnlyPubkey, rootHash]))
                            );
                            threshold = undefined;
                            isTrMutisig = undefined;
                        } else {
                            signer = signerNode;
                            inputLeafHash = tapleafHash({
                                output: input.tapLeafScript[0].script,
                                version: input.tapLeafScript[0].leafVersion,
                            });
                        }
                    } else {
                        signer = signerNode;
                    }
                    this.object.signInput(i, signer);
                    signedInputCount++;
                    if (!threshold || this.isMultisigSignatureComplete(isTrMutisig, isWshMutisig, threshold, publicKeyCount, input)) {
                        this.object.finalizeInput(i);
                        finalizedInputCount++;
                        break;
                    }
                }
            }
            if (isTrMutisig && input.tapScriptSig?.length === threshold && input.tapScriptSig?.length !== publicKeyCount) {
                for (const bip32Derivation of bip32DerivationList.slice(1)) {
                    let tapScriptSigContainsSig = false;
                    for (const tapScriptSig of input.tapScriptSig) {
                        if (bip32Derivation.pubkey.equals(tapScriptSig.pubkey)) {
                            tapScriptSigContainsSig = true;
                            break;
                        }
                    }
                    if (!tapScriptSigContainsSig) {
                        input.tapScriptSig.push({
                            signature: Buffer.from([]),
                            pubkey: bip32Derivation.pubkey,
                            leafHash: inputLeafHash,
                        });
                    }
                }
                this.object.finalizeInput(i);
                finalizedInputCount++;
            }
            if (globalThreshold !== null && threshold) {
                globalThreshold = threshold;
                if (isTrMutisig) {
                    globalSignatureCount = input.tapScriptSig?.length;
                } else if (isWshMutisig) {
                    globalSignatureCount = input.partialSig?.length;
                }
            } else {
                globalThreshold = null;
                globalSignatureCount = null;
            }
        }
        return { threshold: globalThreshold, signatureCount: globalSignatureCount, signedInputCount, finalizedInputCount };
    }

    isMultisigSignatureComplete(isTrMutisig: boolean, isWshMutisig: boolean, threshold: number, publicKeyCount: number, input: PsbtInput) {
        if (isTrMutisig && input.tapScriptSig?.length === publicKeyCount) {
            return true;
        }
        if (isWshMutisig && input.partialSig?.length === threshold) {
            return true;
        }
        return false;
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
    threshold: number;
    signatureCount: number;
}