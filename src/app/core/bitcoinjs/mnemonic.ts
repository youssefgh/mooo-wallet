import * as bip39 from 'bip39';
import * as bitcoinjs from 'bitcoinjs-lib';
import { Bip32Utils } from './bip32.utils';
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

    matchsKey(key: string, network: bitcoinjs.Network) {
        try {
            const purposeArray = [86, 84, 49, 44];
            // TODO support other accounts
            const account = 0;
            for (const purpose of purposeArray) {
                const pub = this.extendedPublicKey(purpose, account, network);
                if (pub === key) {
                    return true;
                }
            }
        } catch (e) {
        }
        return false;
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

    extendedPublicKey(purpose: number, account: number, network: bitcoinjs.Network) {
        const hdRoot = HdRoot.from(this, purpose, network);
        const accountNode = hdRoot.deriveHardened(purpose).deriveHardened(HdCoin.id(network)).
            deriveHardened(account);
        return accountNode.neutered().toBase58();
    }

    descriptor(purpose: number, account: number, network: bitcoinjs.Network) {
        let template: string;
        switch (purpose) {
            case 86: template = 'tr([X1X2]X3X4)'; break;
            case 84: template = 'wpkh([X1X2]X3X4)'; break;
            case 49: template = 'sh(wpkh([X1X2]X3X4))'; break;
        }
        const seed = bip39.mnemonicToSeedSync(this.phrase, this.passphrase);
        const hdRoot = Bip32Utils.instance.fromSeed(seed, network);
        const accountNode = hdRoot.deriveHardened(purpose).deriveHardened(HdCoin.id(network)).
            deriveHardened(account);
        template = template.replace('X1', hdRoot.fingerprint.toString('hex'));
        template = template.replace('X2', '/' + purpose + "'/" + HdCoin.id(network) + "'/" + account + "'");
        template = template.replace('X3', accountNode.neutered().toBase58());
        return template;
    }

}
