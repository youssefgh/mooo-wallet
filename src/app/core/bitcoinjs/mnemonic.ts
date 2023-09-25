import * as bip39 from 'bip39';
import * as bitcoinjs from 'bitcoinjs-lib';
import { HdCoin } from './hd-coin';
import { HdRoot } from './hd-root';

export class Mnemonic {

    phrase: string;
    passphrase: string;

    static new(strength: number) {
        const instance = new Mnemonic();
        instance.phrase = bip39.generateMnemonic(strength);
        return instance;
    }

    static passphraseHashFrom(passphrase: string) {
        return bitcoinjs.crypto.sha256(Buffer.from(passphrase)).toString('hex');
    }

    phraseValid() {
        return bip39.validateMnemonic(this.phrase);
    }

    passphraseHash() {
        return Mnemonic.passphraseHashFrom(this.passphrase);
    }

    passphraseValid(mnemonicPassphraseHash: string) {
        return this.passphrase && Mnemonic.passphraseHashFrom(this.passphrase) === mnemonicPassphraseHash;
    }

    finalNode(purpose: number, account: number, script: number, network: bitcoinjs.Network) {
        const hdRoot = HdRoot.from(this, network);
        const accountNode = hdRoot.deriveHardened(purpose).deriveHardened(HdCoin.id(network)).
            deriveHardened(account);
        if (script) {
            return accountNode.deriveHardened(script);
        }
        return accountNode;
    }

}
