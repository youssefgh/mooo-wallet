import BIP32Factory from 'bip32';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { Bip32Network } from './bip32-network';
import { Purpose } from './purpose';
import { Wif } from './wif';

export class Bip32Utils {

    static instance = BIP32Factory(ecc);

    static extendedkeyDetailsFromBase58Sip(sipExtendedkey: string, network: bitcoinjs.Network) {
        const purpose = Purpose.from(sipExtendedkey, network);
        const wif = Wif.of(network);
        const sipAccountNode = Bip32Utils.instance.fromBase58(sipExtendedkey, { wif: wif, bip32: Bip32Network.from(purpose, network) });
        const accountNode = Bip32Utils.instance.fromPublicKey(sipAccountNode.publicKey, sipAccountNode.chainCode, network);
        return { purpose, extendedkey: accountNode.neutered().toBase58() };
    }

    static networkFrom(coinId: number) {
        switch (coinId) {
            case 0: return bitcoinjs.networks.bitcoin;
            case 1: return bitcoinjs.networks.testnet;
            case 2: return bitcoinjs.networks.regtest;
        }
        throw new Error('Unkown coinId : ' + coinId);
    }
}
