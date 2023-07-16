import { ConfirmedTransaction } from './confirmed-transaction';
import { Derived } from './derived';

export class Utxo {

    transaction: ConfirmedTransaction;
    vout: number;
    satoshis: number;
    amount: number;
    derived: Derived;
    inCount: number;
    transactionHex: string;

}
