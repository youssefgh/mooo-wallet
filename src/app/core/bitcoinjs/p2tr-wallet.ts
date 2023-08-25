import * as bitcoinjs from 'bitcoinjs-lib';
import { OutputDescriptor } from '../output-descriptor';
import { HdWallet } from './hd-wallet';
import { Mnemonic } from './mnemonic';

export class P2trWallet implements HdWallet {

    outputDescriptor: OutputDescriptor;
    xpub: string;

    static account(mnemonic: Mnemonic, account: number, network: bitcoinjs.Network) {
        const purpose = 86;
        const script = 'tr';
        return HdWallet.account(mnemonic, purpose, account, script, network);
    }

}
