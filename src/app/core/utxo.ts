import {UTXO as BitpayUTXO} from '../core/bitpay/utxo';

export class UTXO implements BitpayUTXO {

    txid: string;
    address: string;
    vout: number;
    scriptPubKey: string;
    amount: number;
    satoshis: number;
    height: number;
    confirmations: number;
    
    getId(){
        return this.txid;
    }

}