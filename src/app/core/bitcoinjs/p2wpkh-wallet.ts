import * as bitcoinjs from 'bitcoinjs-lib';
import { HdWallet } from './hd-wallet';
import { Mnemonic } from './mnemonic';

export class P2wpkhWallet {

    static account(mnemonic: Mnemonic, account: number, network: bitcoinjs.Network) {
        const purpose = 84;
        const script = 'wpkh';
        return HdWallet.account(mnemonic, purpose, account, script, network);
    }

}
