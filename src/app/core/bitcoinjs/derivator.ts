import { BIP32Interface } from 'bip32';
import * as bitcoinjs from 'bitcoinjs-lib';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371';
import { Address } from './address';
import { Bip32Network } from './bip32-network';
import { Bip32Utils } from './bip32.utils';
import { Derived } from './derived';
import { HdCoin } from './hd-coin';
import { Purpose } from './purpose';
import { Wif } from './wif';

export class Derivator {

    static derive(extendedkey: string, change: number, startIndex: number, endIndex: number, network: bitcoinjs.Network) {
        const purpose = Purpose.from(extendedkey, network);
        return Derivator.deriveWithPurpose(extendedkey, purpose, change, startIndex, endIndex, network);
    }

    static deriveWithPurpose(extendedkey: string, purpose: number, change: number, startIndex: number, endIndex: number, network: bitcoinjs.Network) {
        const wif = Wif.of(network);
        const node = Bip32Utils.instance.fromBase58(extendedkey, { wif: wif, bip32: Bip32Network.from(purpose, network) });
        const changeNode = node.derive(change);
        const derivedArray = this.deriveList(purpose, changeNode, startIndex, endIndex, network);

        const coinType = HdCoin.id(network);
        derivedArray.forEach(derived => {
            derived.purpose = purpose;
            derived.coinType = coinType;
            // TODO add multi account support
            derived.account = 0;
            derived.change = change;
        });
        return derivedArray;
    }

    static deriveList(purpose: number, changeNode: BIP32Interface, startIndex: number, endIndex: number, network: bitcoinjs.Network): Array<Derived> {
        let derivedArray = new Array;
        let paymentGenerator;
        switch (purpose) {
            case 44: paymentGenerator = this.bip44Payment;
                break;
            case 49: paymentGenerator = this.bip49Payment;
                break;
            case 84: paymentGenerator = this.bip84Payment;
                break;
            case 86: paymentGenerator = this.bip86Payment;
                break;
            default: // TODO print error
                return;
        }
        derivedArray = this.deriveBIPList(changeNode, startIndex, endIndex, paymentGenerator, network);
        return derivedArray;
    }

    static bip44Payment(publicKey: Buffer, network: bitcoinjs.Network) {
        return bitcoinjs.payments.p2pkh({
            pubkey: publicKey,
            network: network
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
        const derivedList = new Array;
        for (let i = startIndex; i < endIndex; i++) {
            const derived = this.deriveBIP(changeNode, i, paymentGenerator, network);
            derivedList.push(derived);
        }
        return derivedList;
    }

    static deriveBIP(changeNode: BIP32Interface, index: number, paymentGenerator: Function, network: bitcoinjs.Network) {
        const derived = new Derived;
        const publicKey = changeNode.derive(index).publicKey;
        const payment = paymentGenerator(publicKey, network);
        derived.address = new Address(payment.address);
        derived.index = index;
        derived.publicKey = publicKey;
        return derived;
    }

}
