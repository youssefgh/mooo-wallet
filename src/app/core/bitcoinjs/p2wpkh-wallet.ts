import * as bitcoinjs from 'bitcoinjs-lib';
import { HdCoin } from './hd-coin';
import { HdRoot } from './hd-root';
import { HdWallet } from './hd-wallet';
import { Mnemonic } from './mnemonic';

export class P2wpkhWallet implements HdWallet {

    xpub: string;

    static account(mnemonic: Mnemonic, account: number, network: bitcoinjs.Network) {
        const instance = new P2wpkhWallet();
        const purpose = 84;
        const hdRoot = HdRoot.from(mnemonic, purpose, network);
        const accountNode = hdRoot.deriveHardened(purpose).deriveHardened(HdCoin.id(network)).deriveHardened(account);
        instance.xpub = accountNode.neutered().toBase58();
        return instance;
    }

}
