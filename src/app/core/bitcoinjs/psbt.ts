import * as bip39 from 'bip39';
import * as bitcoinjs from 'bitcoinjs-lib';
import { Output } from '../output';
import { Transaction } from '../transaction';
import { Mnemonic } from './mnemonic';

export class Psbt {

    base64: string;
    object: bitcoinjs.Psbt;
    network: bitcoinjs.Network;
    signedTransaction: string;

    static fromText(base64: string, network: bitcoinjs.Network) {
        const instance = new Psbt;
        instance.base64 = base64;
        instance.network = network;
        instance.object = bitcoinjs.Psbt.fromBase64(base64, { network: network });
        return instance;
    }

    // signPsbtHex(mnemonic: Mnemonic, network: bitcoinjs.Network) {
    //     const psbt = bitcoinjs.Psbt.fromBase64(this.base64, { network: network });
    //     return this.signPsbt(mnemonic, psbt, network);
    // }


    static from(outputArray: Output[], changeOutput: Output, utxoArray: Transaction[], network: bitcoinjs.Network) {
        const instance = new Psbt;
        const psbt = new bitcoinjs.Psbt({ network: network });
        for (let i = 0; i < utxoArray.length; i++) {
            const utxo = utxoArray[i];
            const bip32Derivation = utxo.derived.bip32Derivation();
            if (utxo.derived.purpose === 84) {
                const transaction = bitcoinjs.Transaction.fromHex(utxo.transactionHex);
                psbt.addInput({
                    hash: utxo.id,
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
                    hash: utxo.id,
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
                    hash: utxo.id,
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
        for (let i = 0; i < outputArray.length; i++) {
            const output = outputArray[i];
            psbt.addOutput({ address: output.destination, value: output.amount });
        }
        if (changeOutput.amount !== 0) {
            psbt.addOutput({ address: changeOutput.destination, value: changeOutput.amount });
        }
        instance.object = psbt;
        instance.base64 = psbt.toBase64();
        return instance;
    }

    sign(mnemonic: Mnemonic) {
        const seed = bip39.mnemonicToSeed(mnemonic.phrase, mnemonic.passphrase);
        const hdRoot = bitcoinjs.bip32.fromSeed(seed, this.network);
        for (let index = 0; index < this.object.inputCount; index++) {
            (this.object as any).data.inputs[index].bip32Derivation[0].masterFingerprint = hdRoot.fingerprint;
        }
        this.object.signAllInputsHD(hdRoot);
        if (!this.object.validateSignaturesOfAllInputs()) {
            throw new Error('Invalid signature');
        }
        this.object.finalizeAllInputs();
        this.signedTransaction = this.object.extractTransaction().toHex();
    }

}
