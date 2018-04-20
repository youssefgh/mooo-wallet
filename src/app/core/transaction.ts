import * as bitcoinjs from 'bitcoinjs-lib';

export class Transaction {

    id: string;
    vout: number;
    satoshis: number;
    amount:  number;
    height: number;
    confirmations: number;
    
    inList = new Array<bitcoinjs.In>();

}