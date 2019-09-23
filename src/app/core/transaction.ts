import * as bitcoinjs from 'bitcoinjs-lib';
import { Derived } from './derived';

export class Transaction {

    id: string
    vout: number
    satoshis: number
    amount: number
    height: number
    confirmations: number
    derived: Derived
    inCount: number
    transactionHex: string

}