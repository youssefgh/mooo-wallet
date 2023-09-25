import { TapLeafScript, TapTree } from 'bip174/src/lib/interfaces';
import * as bitcoinjs from 'bitcoinjs-lib';
import { rootHashFromPath, tapleafHash } from 'bitcoinjs-lib/src/payments/bip341';
import { tapTreeToList } from 'bitcoinjs-lib/src/psbt/bip371';
import { OutputDescriptor } from '../output-descriptor';
import { OutputDescriptorKey } from '../output-descriptor-key';
import { Derivator } from './derivator';
import { Output } from './output';
import { Psbt } from './psbt';
import { Utxo } from './utxo';

export class PsbtFactory {

    static create(outputDescriptor: OutputDescriptor, outputArray: Output[], changeOutput: Output, utxoArray: Utxo[], network: bitcoinjs.Network) {
        const instance = new Psbt();
        let referenceOutputDescriptorKey: OutputDescriptorKey;
        if (outputDescriptor.key) {
            referenceOutputDescriptorKey = outputDescriptor.key;
        } else if (outputDescriptor.sortedmultiParamList) {
            referenceOutputDescriptorKey = outputDescriptor.sortedmultiParamList[0];
        } else if (outputDescriptor.sortedmultiaParamList) {
            referenceOutputDescriptorKey = outputDescriptor.sortedmultiaParamList[0];
        }
        const derivationDetails = referenceOutputDescriptorKey.derivationDetails();
        const psbt = new bitcoinjs.Psbt({ network: network });
        for (const utxo of utxoArray) {
            const transaction = bitcoinjs.Transaction.fromHex(utxo.transactionHex);
            if (outputDescriptor.sortedmultiaParamList) {
                const tapBip32DerivationList = utxo.derived.tapBip32DerivationList(network);
                const tapInternalKey = tapBip32DerivationList[0].pubkey;
                const details = outputDescriptor.taprootMultisigDetails(utxo.derived.change, utxo.derived.index, network);
                const tapLeafScript: TapLeafScript = {
                    leafVersion: details.redeem.redeemVersion,
                    script: details.redeem.output,
                    controlBlock: utxo.derived.witness[utxo.derived.witness.length - 1],
                };
                const leafHash = tapleafHash({
                    output: details.redeem.output,
                    version: details.redeem.redeemVersion,
                });
                const rootHash = rootHashFromPath(tapLeafScript.controlBlock, leafHash);
                for (let i = 1; i < tapBip32DerivationList.length; i++) {
                    const tapBip32Derivation = tapBip32DerivationList[i];
                    tapBip32Derivation.leafHashes = [leafHash];
                }
                psbt.addInput({
                    hash: utxo.transaction.id,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: transaction.outs[utxo.vout].script,
                        value: utxo.satoshis
                    },
                    tapInternalKey,
                    tapBip32Derivation: tapBip32DerivationList,
                    tapLeafScript: [tapLeafScript],
                    tapMerkleRoot: rootHash,
                });
            } else if (derivationDetails.purpose === 86) {
                const tapBip32DerivationList = utxo.derived.tapBip32DerivationList(network);
                const tapInternalKey = tapBip32DerivationList[0].pubkey;
                psbt.addInput({
                    hash: utxo.transaction.id,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: transaction.outs[utxo.vout].script,
                        value: utxo.satoshis
                    },
                    tapInternalKey,
                    tapBip32Derivation: tapBip32DerivationList,
                });
            } else if (derivationDetails.purpose === 84) {
                psbt.addInput({
                    hash: utxo.transaction.id,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: transaction.outs[utxo.vout].script,
                        value: utxo.satoshis
                    },
                    bip32Derivation: utxo.derived.bip32DerivationList(network),
                });
            } else if (derivationDetails.purpose === 48 && derivationDetails.script === 2) {
                const publicKeyListSorted = outputDescriptor.sortedmultiParamList.map(outputDescriptorKey => outputDescriptorKey.publicKey(utxo.derived.change, utxo.derived.index, network)).sort((x1, x2) => x1.compare(x2));
                const p2ms = Derivator.bip48Payment(outputDescriptor.threshold, publicKeyListSorted, network);
                psbt.addInput({
                    hash: utxo.transaction.id,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: transaction.outs[utxo.vout].script,
                        value: utxo.satoshis
                    },
                    witnessScript: p2ms.redeem.output,
                    bip32Derivation: utxo.derived.bip32DerivationList(network),
                });
            } else if (derivationDetails.purpose === 49) {
                const p2wpkh = bitcoinjs.payments.p2wpkh({ pubkey: outputDescriptor.key.publicKey(utxo.derived.change, utxo.derived.index, network), network: network });
                const p2sh = bitcoinjs.payments.p2sh({ redeem: p2wpkh, network: network });
                const transaction = bitcoinjs.Transaction.fromHex(utxo.transactionHex);
                psbt.addInput({
                    hash: utxo.transaction.id,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: transaction.outs[utxo.vout].script,
                        value: utxo.satoshis
                    },
                    redeemScript: p2sh.redeem.output,
                    bip32Derivation: utxo.derived.bip32DerivationList(network),
                });
            } else if (derivationDetails.purpose === 44) {
                psbt.addInput({
                    hash: utxo.transaction.id,
                    index: utxo.vout,
                    nonWitnessUtxo: Buffer.from(utxo.transactionHex, 'hex'),
                    bip32Derivation: utxo.derived.bip32DerivationList(network),
                });
            } else {
                throw new Error('Incompatible purpose ' + derivationDetails.purpose);
            }
        }
        for (const output of outputArray) {
            psbt.addOutput({ address: output.destination, value: output.amount });
        }
        if (changeOutput.amount !== 0) {
            if (outputDescriptor.sortedmultiaParamList) {
                const tapBip32DerivationList = changeOutput.derived.tapBip32DerivationList(network);
                const details = outputDescriptor.taprootMultisigDetails(changeOutput.derived.change, changeOutput.derived.index, network);
                const tapTree: TapTree = { leaves: tapTreeToList(details.scriptTree) };
                const leafHash = tapleafHash({
                    output: details.redeem.output,
                    version: details.redeem.redeemVersion,
                });
                for (let i = 1; i < tapBip32DerivationList.length; i++) {
                    const tapBip32Derivation = tapBip32DerivationList[i];
                    tapBip32Derivation.leafHashes = [leafHash];
                }

                psbt.addOutput({
                    address: changeOutput.destination, value: changeOutput.amount, tapBip32Derivation: tapBip32DerivationList, tapTree
                });
            } else if (derivationDetails.purpose === 86) {
                psbt.addOutput({ address: changeOutput.destination, value: changeOutput.amount, tapBip32Derivation: changeOutput.derived?.tapBip32DerivationList(network) });
            } else {
                psbt.addOutput({ address: changeOutput.destination, value: changeOutput.amount, bip32Derivation: changeOutput.derived?.bip32DerivationList(network) });
            }
        }
        instance.object = psbt;
        return instance;
    }

}
