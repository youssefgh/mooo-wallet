import * as bip39 from 'bip39';
import * as bitcoinjs from 'bitcoinjs-lib';
import { OutputDescriptor } from '../output-descriptor';
import { OutputDescriptorKey } from '../output-descriptor-key';
import { Derivator } from './derivator';
import { Derived } from './derived';
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

    deriveDescriptors(purpose: number, coinType: number, account: number, script: number, network: bitcoinjs.Network) {
        let publicDescriptor: string;
        let privateDescriptor: string;
        let publicDescriptorKey: string;
        let privateDescriptorKey: string;

        const hdRoot = HdRoot.from(this, network);
        const finalNode = this.finalNode(purpose, account, script, network);

        const publicOutputDescriptorKey = new OutputDescriptorKey();
        publicOutputDescriptorKey.fingerprint = hdRoot.fingerprint.toString('hex');
        publicOutputDescriptorKey.derivation = `/${purpose}'/${coinType}'/${account}'`;
        if (purpose == 48) {
            publicOutputDescriptorKey.derivation = `${publicOutputDescriptorKey.derivation}/${script}'`;
        }
        publicOutputDescriptorKey.value = finalNode.neutered().toBase58();
        if (purpose == 48) {
            publicDescriptorKey = publicOutputDescriptorKey.toString();
        } else {
            const publicOutputDescriptor = new OutputDescriptor();
            publicOutputDescriptor.script = OutputDescriptor.scriptFromPurpose(purpose);
            publicOutputDescriptor.key = publicOutputDescriptorKey;
            publicDescriptor = publicOutputDescriptor.toString();
        }

        const privateOutputDescriptorKey = new OutputDescriptorKey();
        privateOutputDescriptorKey.fingerprint = hdRoot.fingerprint.toString('hex');
        privateOutputDescriptorKey.derivation = `/${purpose}'/${coinType}'/${account}'`;
        if (purpose == 48) {
            privateOutputDescriptorKey.derivation = `${privateOutputDescriptorKey.derivation}/${script}'`;
        }
        privateOutputDescriptorKey.value = finalNode.toBase58();
        if (purpose == 48) {
            privateDescriptorKey = privateOutputDescriptorKey.toString();
        } else {
            const privateOutputDescriptor = new OutputDescriptor();
            privateOutputDescriptor.script = OutputDescriptor.scriptFromPurpose(purpose);
            privateOutputDescriptor.key = privateOutputDescriptorKey;
            privateDescriptor = privateOutputDescriptor.toString();
        }

        return { publicDescriptor, privateDescriptor, publicDescriptorKey, privateDescriptorKey };
    }

    deriveList(purpose: number, coinType: number, account: number, script: number, change: number, startIndex: number, endIndex: number, network: bitcoinjs.Network) {
        let derivedArray: Array<Derived>;

        const finalNode = this.finalNode(purpose, account, script, network);

        if (purpose !== 48) {
            derivedArray = Derivator.deriveList(purpose, finalNode.derive(change), startIndex, endIndex, network);
        }

        const deriveDescriptorsResponse = this.deriveDescriptors(purpose, coinType, account, script, network);

        return { publicDescriptor: deriveDescriptorsResponse.publicDescriptor, privateDescriptor: deriveDescriptorsResponse.privateDescriptor, publicDescriptorKey: deriveDescriptorsResponse.publicDescriptorKey, privateDescriptorKey: deriveDescriptorsResponse.privateDescriptorKey, derivedArray };
    }

}
