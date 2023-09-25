import { Bip32Derivation, TapBip32Derivation } from 'bip174/src/lib/interfaces';
import * as bitcoinjs from 'bitcoinjs-lib';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371';
import { OutputDescriptorKey } from '../output-descriptor-key';
import { Address } from './address';

export class Derived {

    address: Address;
    witness: Buffer[];
    outputDescriptorKeyList: OutputDescriptorKey[];
    change: number;
    index: number;

    path(outputDescriptorKey: OutputDescriptorKey) {
        return `m${outputDescriptorKey.derivation}/${this.change}/${this.index}`;
    }

    bip32DerivationList(network: bitcoinjs.Network): Bip32Derivation[] {
        const bip32DerivationList = new Array<Bip32Derivation>();
        for (const outputDescriptorKey of this.outputDescriptorKeyList) {
            const pubkey = outputDescriptorKey.publicKey(this.change, this.index, network);
            bip32DerivationList.push({
                masterFingerprint: Buffer.from(outputDescriptorKey.fingerprint, 'hex'),
                pubkey,
                path: this.path(outputDescriptorKey).replace('h', "'"),
            });
        }
        return bip32DerivationList;
    }

    tapBip32DerivationList(network: bitcoinjs.Network): TapBip32Derivation[] {
        const tapBip32DerivationList = new Array<TapBip32Derivation>();
        for (const outputDescriptorKey of this.outputDescriptorKeyList) {
            const pubkey = this.tapInternalKey(outputDescriptorKey.publicKey(this.change, this.index, network));
            tapBip32DerivationList.push({
                masterFingerprint: Buffer.from(outputDescriptorKey.fingerprint, 'hex'),
                pubkey,
                path: this.path(outputDescriptorKey).replaceAll('h', "'"),
                leafHashes: [],
            });
        }
        return tapBip32DerivationList;
    }

    tapInternalKey(publicKey: Buffer) {
        return toXOnly(publicKey);
    }

}
