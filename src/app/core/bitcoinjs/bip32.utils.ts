import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';

export class Bip32Utils {

    static instance = BIP32Factory(ecc);

}
