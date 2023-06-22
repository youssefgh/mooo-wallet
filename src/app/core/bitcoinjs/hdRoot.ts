import BIP32Factory from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { Bip32Network } from './bip32Network';
import { Mnemonic } from './mnemonic';
import { Bip32Utils } from '../bip32.utils';

export class HdRoot {

    static bip32 = BIP32Factory(ecc);

    static from(mnemonic: Mnemonic, purpose: number, network: bitcoinjs.Network) {
        const seed = bip39.mnemonicToSeedSync(mnemonic.phrase, mnemonic.passphrase);
        const bip32Network = Bip32Network.from(purpose, network);
        return Bip32Utils.instance.fromSeed(seed, { wif: network.wif, bip32: bip32Network });
    }

}
