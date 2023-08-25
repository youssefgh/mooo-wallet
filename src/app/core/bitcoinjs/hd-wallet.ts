import * as bitcoinjs from 'bitcoinjs-lib';
import { OutputDescriptor } from "../output-descriptor";
import { OutputDescriptorKey } from '../output-descriptor-key';
import { HdCoin } from './hd-coin';
import { HdRoot } from './hd-root';
import { Mnemonic } from './mnemonic';

export class HdWallet {

    outputDescriptor: OutputDescriptor;

    static account(mnemonic: Mnemonic, purpose: number, account: number, script: string, network: bitcoinjs.Network) {
        const instance = new HdWallet();
        const hdRoot = HdRoot.from(mnemonic, network);
        const hdCoin = HdCoin.id(network)
        const accountNode = hdRoot.deriveHardened(purpose).deriveHardened(hdCoin).deriveHardened(account);
        instance.outputDescriptor = new OutputDescriptor();
        instance.outputDescriptor.key = new OutputDescriptorKey();
        instance.outputDescriptor.script = script;
        instance.outputDescriptor.key.fingerprint = hdRoot.fingerprint.toString('hex');
        instance.outputDescriptor.key.derivation = `/${purpose}'/${hdCoin}'/${account}'`;
        instance.outputDescriptor.key.value = accountNode.neutered().toBase58();
        return instance;
    }

}
