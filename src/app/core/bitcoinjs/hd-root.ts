import * as bip39 from 'bip39';
import * as bitcoinjs from 'bitcoinjs-lib';
import { Bip32Network } from './bip32-network';
import { Bip32Utils } from './bip32.utils';
import { Mnemonic } from './mnemonic';

export class HdRoot {

    static from(mnemonic: Mnemonic, purpose: number, network: bitcoinjs.Network) {
        const seed = bip39.mnemonicToSeedSync(mnemonic.phrase, mnemonic.passphrase);
        const bip32Network = Bip32Network.from(purpose, network);
        return Bip32Utils.instance.fromSeed(seed, { wif: network.wif, bip32: bip32Network });
    }

}
