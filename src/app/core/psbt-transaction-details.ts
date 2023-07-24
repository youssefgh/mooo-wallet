import * as bitcoinjs from 'bitcoinjs-lib';
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

        for (let i = 0; i < psbt.txOutputs.length; i++) {
            const txOutput = psbt.txOutputs[i];
            if (!psbt.data.outputs[i].tapBip32Derivation && !psbt.data.outputs[i].bip32Derivation) {
                const walletDestination = new WalletDestination();
                walletDestination.address = bitcoinjs.address.fromOutputScript(txOutput.script, network);
                walletDestination.amount = txOutput.value / SAT_IN_BITCOIN;
                instance.walletDestinationList.push(walletDestination);
            }
        }
        return instance;
    }

    calculateFees() {
        this.fee = this.psbt.getFee();
        this.feeRate = this.psbt.getFeeRate();
    }

}
