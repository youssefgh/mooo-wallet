
export interface UTXO {

    txid: string;
    address: string;
    vout: number;
    scriptPubKey: string;
    amount: number;
    satoshis: number;
    height: number;
    confirmations: number;

}
