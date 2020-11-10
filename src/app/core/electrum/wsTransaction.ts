import { Derived } from '../derived';

export class WsTransaction {

    id: string;
    vout: number;
    satoshis: number;
    amount: number;
    height: number;
    confirmations: number;
    derived: Derived;
    inCount: number;
    transactionHex: string;

}
