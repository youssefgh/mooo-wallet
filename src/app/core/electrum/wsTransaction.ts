import { Derived } from '../derived';

export class WsTransaction {

    id: string;
    height: number;
    confirmations: number;

    // todo move to separate class
    vout: number;
    satoshis: number;
    amount: number;
    derived: Derived;
    inCount: number;
    transactionHex: string;

}
