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
        const inputSignResultList = this.signIndependently(hdRoot);
        let finalized = true;
        for (const inputSignResult of inputSignResultList) {
            if (!inputSignResult.alreadySigned && !inputSignResult.finalized) {
                finalized = false;
                break;
            }
        }
        if (finalized) {
            signedTransaction = this.object.extractTransaction().toHex();
        } else {
            let signed = false;
            for (const inputSignResult of inputSignResultList) {
                if (inputSignResult.signedCount > 0) {
                    signed = true;
                    break;
                }
            }
            if (signed) {
                psbtBase64 = this.object.toBase64();
            }
        }
        return { signedTransaction, psbtBase64, inputSignResultList };
    }

    signIndependently(hdRoot: BIP32Interface) {
        const inputSignResultList = new Array<InputSignResult>();
        for (let i = 0; i < this.object.txInputs.length; i++) {
            const input = this.object.data.inputs[i];
            const inputSignResult = new InputSignResult();
            inputSignResult.hash = this.object.txInputs[i].hash.toString('hex');
            inputSignResult.index = this.object.txInputs[i].index;
            inputSignResultList.push(inputSignResult);
            let bip32DerivationList = this.bip32Derivation(input);
            if (!bip32DerivationList) {
                inputSignResult.alreadySigned = true;
                continue;
            }
            let isWshMutisig = false;
            let isTrMutisig = false;
            let publicKeyCount: number;
            let inputLeafHash: Buffer;
            if (input.bip32Derivation?.length > 1) {
                const p2ms = bitcoinjs.payments.p2ms({ output: input.witnessScript });
                inputSignResult.threshold = p2ms.m;
                isWshMutisig = true;
            } else if (input.tapBip32Derivation?.length > 1) {
                const chunks = bitcoinjs.script.decompile(input.tapLeafScript[0].script);
                inputSignResult.threshold = chunks[chunks.length - 2] as number - bitcoinjs.script.OPS.OP_RESERVED;
                publicKeyCount = bip32DerivationList.length - 1;
                isTrMutisig = true;
            } else {
                inputSignResult.threshold = 1;
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
            if (isTrMutisig) {
                if (input.tapScriptSig) {
                    inputSignResult.signatureCount = input.tapScriptSig.length;
                } else {
                    inputSignResult.signatureCount = 0;
                }
            } else if (isWshMutisig) {
                if (input.partialSig) {
                    inputSignResult.signatureCount = input.partialSig.length;
                } else {
                    inputSignResult.signatureCount = 0;
                }
            }
            for (const bip32Derivation of bip32DerivationList) {
                if (this.isMultisigSignatureComplete(isTrMutisig, isWshMutisig, inputSignResult.threshold, publicKeyCount, input)) {
                    this.object.finalizeInput(i);
                    inputSignResult.finalized = true;
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
                            inputSignResult.threshold = 1;
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
                    inputSignResult.signedCount++;
                    inputSignResult.signatureCount++;
                    if (inputSignResult.threshold === 1 || this.isMultisigSignatureComplete(isTrMutisig, isWshMutisig, inputSignResult.threshold, publicKeyCount, input)) {
                        this.object.finalizeInput(i);
                        inputSignResult.finalized = true;
                        break;
                    }
                }
            }
            if (isTrMutisig && input.tapScriptSig?.length === inputSignResult.threshold && input.tapScriptSig?.length !== publicKeyCount) {
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
                inputSignResult.finalized = true;
            }
        }
        return inputSignResultList;
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
    inputSignResultList: InputSignResult[];
}

export class InputSignResult {
    hash: string;
    index: number;
    alreadySigned: boolean;
    threshold: number;
    signedCount = 0;
    signatureCount: number;
    finalized: boolean;
}