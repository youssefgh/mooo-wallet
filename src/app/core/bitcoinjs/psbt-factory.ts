import { TapLeafScript } from 'bip174/src/lib/interfaces';
import * as bitcoinjs from 'bitcoinjs-lib';
import { OutputDescriptor } from '../output-descriptor';
import { OutputDescriptorKey } from '../output-descriptor-key';
import { Derivator } from './derivator';
import { Output } from './output';
import { Psbt } from './psbt';
import { Utxo } from './utxo';

export class PsbtFactory {

    static create(outputDescriptorString: string, outputArray: Output[], changeOutput: Output, utxoArray: Utxo[], network: bitcoinjs.Network) {
        const instance = new Psbt();
        const outputDescriptor = OutputDescriptor.from(outputDescriptorString);
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
            const bip32DerivationList = utxo.derived.bip32DerivationList(network);
            const transaction = bitcoinjs.Transaction.fromHex(utxo.transactionHex);
            if (derivationDetails.purpose === 86) {
                const tapInternalKey = utxo.derived.tapBip32DerivationList(network)[0].pubkey;
                psbt.addInput({
                    hash: utxo.transaction.id,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: transaction.outs[utxo.vout].script,
                        value: utxo.satoshis
                    },
                    tapInternalKey,
                    tapBip32Derivation: utxo.derived.tapBip32DerivationList(network),
                });

                if (outputDescriptor.sortedmultiaParamList) {
                    const details = outputDescriptor.details(network);
                    const tapLeafScript: TapLeafScript = {
                        leafVersion: details.redeem.redeemVersion,
                        script: details.redeem.output,
                        controlBlock: utxo.derived.witness[utxo.derived.witness.length - 1],
                    };
                    psbt.updateInput(0, { tapLeafScript: [tapLeafScript] });
                }
            } else if (derivationDetails.purpose === 84) {
                psbt.addInput({
                    hash: utxo.transaction.id,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: transaction.outs[utxo.vout].script,
                        value: utxo.satoshis
                    },
                    bip32Derivation: bip32DerivationList,
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
                    bip32Derivation: bip32DerivationList,
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
                    bip32Derivation: bip32DerivationList,
                });
            } else if (derivationDetails.purpose === 44) {
                psbt.addInput({
                    hash: utxo.transaction.id,
                    index: utxo.vout,
                    nonWitnessUtxo: Buffer.from(utxo.transactionHex, 'hex'),
                    bip32Derivation: bip32DerivationList,
                });
            } else {
                throw new Error('Incompatible purpose ' + derivationDetails.purpose);
            }
        }
        for (const output of outputArray) {
            psbt.addOutput({ address: output.destination, value: output.amount });
        }
        if (changeOutput.amount !== 0) {
            if (derivationDetails.purpose === 86) {
                psbt.addOutput({ address: changeOutput.destination, value: changeOutput.amount, tapBip32Derivation: changeOutput.derived?.tapBip32DerivationList(network) });
            } else {
                psbt.addOutput({ address: changeOutput.destination, value: changeOutput.amount, bip32Derivation: changeOutput.derived?.bip32DerivationList(network) });
            }
        }
        instance.object = psbt;
        return instance;
    }

}
