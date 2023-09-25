import { BIP32Interface } from 'bip32';
import * as bitcoinjs from 'bitcoinjs-lib';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371';
import { OutputDescriptor } from '../output-descriptor';
import { OutputDescriptorKey } from '../output-descriptor-key';
import { Address } from './address';
import { Derived } from './derived';
import { HdRoot } from './hd-root';
import { Mnemonic } from './mnemonic';

export class Derivator {

    static deriveListFromMnemonic(mnemonic: Mnemonic, purpose: number, coinType: number, account: number, script: number, change: number, startIndex: number, endIndex: number, network: bitcoinjs.Network) {
        let derivedArray: Array<Derived>;
        let publicDescriptor: string;
        let privateDescriptor: string;
        let publicDescriptorKey: string;
        let privateDescriptorKey: string;

        const hdRoot = HdRoot.from(mnemonic, network);
        const finalNode = mnemonic.finalNode(purpose, account, script, network);

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

        if (purpose !== 48) {
            derivedArray = Derivator.deriveList(purpose, finalNode.derive(change), startIndex, endIndex, network);
        }

        return { publicDescriptor, privateDescriptor, publicDescriptorKey, privateDescriptorKey, derivedArray };
    }

    static deriveOne(purpose: number, finalNode: BIP32Interface, index: number, network: bitcoinjs.Network) {
        const paymentGenerator = this.paymentGenerator(purpose);
        return this.deriveBIP(finalNode, index, paymentGenerator, network);
    }

    static deriveList(purpose: number, changeNode: BIP32Interface, startIndex: number, endIndex: number, network: bitcoinjs.Network) {
        const paymentGenerator = this.paymentGenerator(purpose);
        return this.deriveBIPList(changeNode, startIndex, endIndex, paymentGenerator, network);
    }

    static paymentGenerator(purpose: number) {
        let paymentGenerator;
        switch (purpose) {
            case 49: paymentGenerator = this.bip49Payment;
                break;
            case 84: paymentGenerator = this.bip84Payment;
                break;
            case 86: paymentGenerator = this.bip86Payment;
                break;
            default: throw new Error('Incompatible purpose');
        }
        return paymentGenerator;
    }

    static bip48Payment(threshold: number, publicKeyList: Array<Buffer>, network: bitcoinjs.Network) {
        return bitcoinjs.payments.p2wsh({
            redeem: bitcoinjs.payments.p2ms({
                m: threshold,
                pubkeys: publicKeyList,
                network: network
            }),
            network: network,
        });
    }

    static bip49Payment(publicKey: Buffer, network: bitcoinjs.Network) {
        return bitcoinjs.payments.p2sh({
            redeem: bitcoinjs.payments.p2wpkh({
                pubkey: publicKey,
                network: network
            }),
            network: network
        });
    }

    static bip84Payment(publicKey: Buffer, network: bitcoinjs.Network) {
        return bitcoinjs.payments.p2wpkh({
            pubkey: publicKey,
            network: network
        });
    }

    static bip86Payment(publicKey: Buffer, network: bitcoinjs.Network) {
        return bitcoinjs.payments.p2tr({
            internalPubkey: toXOnly(publicKey),
            network: network
        });
    }

    static deriveBIPList(changeNode: BIP32Interface, startIndex: number, endIndex: number,
        paymentGenerator: Function, network: bitcoinjs.Network) {
        const derivedList = new Array<Derived>;
        for (let i = startIndex; i < endIndex; i++) {
            const derived = this.deriveBIP(changeNode.derive(i), i, paymentGenerator, network);
            derivedList.push(derived);
        }
        return derivedList;
    }

    static deriveBIP(finalNode: BIP32Interface, index: number, paymentGenerator: Function, network: bitcoinjs.Network) {
        const derived = new Derived;
        const publicKey = finalNode.publicKey;
        const payment = paymentGenerator(publicKey, network);
        derived.address = new Address(payment.address);
        derived.witness = payment.witness;
        derived.index = index;
        return derived;
    }

}
