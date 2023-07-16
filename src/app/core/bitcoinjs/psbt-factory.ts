import * as bitcoinjs from 'bitcoinjs-lib';
import { Output } from './output';
import { Psbt } from './psbt';
import { Utxo } from './utxo';

export class PsbtFactory {

    static create(outputArray: Output[], changeOutput: Output, utxoArray: Utxo[], network: bitcoinjs.Network) {
        const instance = new Psbt();
        const psbt = new bitcoinjs.Psbt({ network: network });
        for (const utxo of utxoArray) {
            const bip32Derivation = utxo.derived.bip32Derivation();
            const transaction = bitcoinjs.Transaction.fromHex(utxo.transactionHex);
            if (utxo.derived.purpose === 86) {
                const tapInternalKey = utxo.derived.tapInternalKey();
                psbt.addInput({
                    hash: utxo.transaction.id,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: transaction.outs[utxo.vout].script,
                        value: utxo.satoshis
                    },
                    tapInternalKey,
                    tapBip32Derivation: [
                        utxo.derived.tapBip32Derivation(tapInternalKey),
                    ]
                });
            } else if (utxo.derived.purpose === 84) {
                psbt.addInput({
                    hash: utxo.transaction.id,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: transaction.outs[utxo.vout].script,
                        value: utxo.satoshis
                    },
                    bip32Derivation: [
                        bip32Derivation
                    ]
                });
            } else if (utxo.derived.purpose === 49) {
                const p2wpkh = bitcoinjs.payments.p2wpkh({ pubkey: utxo.derived.publicKey, network: network });
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
                    bip32Derivation: [
                        bip32Derivation
                    ]
                });
            } else if (utxo.derived.purpose === 44) {
                psbt.addInput({
                    hash: utxo.transaction.id,
                    index: utxo.vout,
                    nonWitnessUtxo: Buffer.from(utxo.transactionHex, 'hex'),
                    bip32Derivation: [
                        bip32Derivation
                    ]
                });
            } else {
                throw new Error('Incompatible purpose ' + utxo.derived.purpose);
            }
        }
        for (const output of outputArray) {
            psbt.addOutput({ address: output.destination, value: output.amount });
        }
        if (changeOutput.amount !== 0) {
            if (changeOutput.derived.purpose === 86) {
                psbt.addOutput({ address: changeOutput.destination, value: changeOutput.amount, tapBip32Derivation: [changeOutput.derived?.tapBip32Derivation()] });
            } else {
                psbt.addOutput({ address: changeOutput.destination, value: changeOutput.amount, bip32Derivation: [changeOutput.derived?.bip32Derivation()] });
            }
        }
        instance.object = psbt;
        return instance;
    }

}
