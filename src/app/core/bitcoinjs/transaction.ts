import * as bitcoinjs from 'bitcoinjs-lib';

export class Transaction {

    object: bitcoinjs.Transaction;

    static fromHex(hex: string) {
        const instance = new Transaction;
        instance.object = bitcoinjs.Transaction.fromHex(hex);
        return instance;
    }

}
