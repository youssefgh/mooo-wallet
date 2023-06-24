import * as bitcoinjs from 'bitcoinjs-lib';
import { HdCoin } from './hdCoin';
import { HdRoot } from './hdRoot';
import { HdWallet } from './hdWallet';
import { Mnemonic } from './mnemonic';

export class P2trWallet implements HdWallet {

    xpub: string;

    static account0(mnemonic: Mnemonic, network: bitcoinjs.Network) {
        const instance = new P2trWallet();
        const purpose = 86;
        const account = 0;
        const hdRoot = HdRoot.from(mnemonic, purpose, network);
        const accountNode = hdRoot.deriveHardened(purpose).deriveHardened(HdCoin.id(network)).deriveHardened(account);
        instance.xpub = accountNode.neutered().toBase58();
        return instance;
    }

}
