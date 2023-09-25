import * as bitcoinjs from 'bitcoinjs-lib';
import { Derivator } from './bitcoinjs/derivator';
import { HdRoot } from './bitcoinjs/hd-root';
import { Mnemonic } from './bitcoinjs/mnemonic';
import { WalletDestination } from './wallet-destination';

const SAT_IN_BITCOIN = 100000000;

export class PsbtTransactionDetails {

    fee: number;
    feeRate: number;
    walletDestinationList: Array<WalletDestination>;
    psbt: bitcoinjs.Psbt;

    static from(
        psbt: bitcoinjs.Psbt,
        network: bitcoinjs.Network
    ) {
        const instance = new PsbtTransactionDetails();
        instance.psbt = psbt;
        instance.walletDestinationList = new Array();

        for (const txOutput of psbt.txOutputs) {
            const walletDestination = new WalletDestination();
            walletDestination.address = bitcoinjs.address.fromOutputScript(txOutput.script, network);
            walletDestination.amount = txOutput.value / SAT_IN_BITCOIN;
            instance.walletDestinationList.push(walletDestination);
        }
        return instance;
    }

    static fromSigned(
        mnemonic: Mnemonic,
        psbt: bitcoinjs.Psbt,
        network: bitcoinjs.Network
    ) {
        const hdRoot = HdRoot.from(mnemonic, network);
        const instance = new PsbtTransactionDetails();
        instance.psbt = psbt;
        instance.walletDestinationList = new Array();

        for (let i = 0; i < psbt.txOutputs.length; i++) {
            const txOutput = psbt.txOutputs[i];
            const dataTxOutput = psbt.data.outputs[i];
            const walletDestination = new WalletDestination();
            walletDestination.address = bitcoinjs.address.fromOutputScript(txOutput.script, network);
            walletDestination.amount = txOutput.value / SAT_IN_BITCOIN;
            walletDestination.change = false;
            instance.walletDestinationList.push(walletDestination);
            const bip32DerivationList = dataTxOutput.tapBip32Derivation ? dataTxOutput.tapBip32Derivation : dataTxOutput.bip32Derivation;
            if (bip32DerivationList &&
                bip32DerivationList.length === 1) {
                const finalNode = hdRoot.derivePath(bip32DerivationList[0].path.toString());
                const bip32Derivation = bip32DerivationList[0];
                const purpose = parseInt(bip32Derivation.path.split('/')[1].replace("'", ''));
                if (bip32Derivation.masterFingerprint.equals(hdRoot.fingerprint) &&
                    bitcoinjs.address.fromOutputScript(txOutput.script, network) === Derivator.deriveOne(purpose, finalNode, null, network).address.value
                ) {
                    walletDestination.change = true;
                }
            }
        }
        return instance;
    }

    calculateFees() {
        this.fee = this.psbt.getFee();
        this.feeRate = this.psbt.getFeeRate();
    }

}
