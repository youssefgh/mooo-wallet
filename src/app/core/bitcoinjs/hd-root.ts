import * as bip39 from 'bip39';
import * as bitcoinjs from 'bitcoinjs-lib';
import { Bip32Utils } from './bip32.utils';
import { Mnemonic } from './mnemonic';

export class HdRoot {

    static from(mnemonic: Mnemonic, network: bitcoinjs.Network) {
        const seed = bip39.mnemonicToSeedSync(mnemonic.phrase, mnemonic.passphrase);
        return Bip32Utils.instance.fromSeed(seed, network);
    }

}
