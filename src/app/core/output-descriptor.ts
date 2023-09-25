import * as bitcoinjs from 'bitcoinjs-lib';
import { LEAF_VERSION_TAPSCRIPT } from 'bitcoinjs-lib/src/payments/bip341';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371';
import { Taptree } from 'bitcoinjs-lib/src/types';
import { Address } from './bitcoinjs/address';
import { Bip32Utils } from './bitcoinjs/bip32.utils';
import { Derivator } from './bitcoinjs/derivator';
import { Derived } from './bitcoinjs/derived';
import { OutputDescriptorKey } from './output-descriptor-key';

export class OutputDescriptor {

    script: string;
    key: OutputDescriptorKey;
    checksum: string;

    threshold: number;
    sortedmultiParamList: Array<OutputDescriptorKey>;
    sortedmultiaParamList: Array<OutputDescriptorKey>;

    static from(
        text: string,
    ) {
        const instance = new OutputDescriptor();

        text = text.trim();

        for (const script of ['tr', 'wpkh', 'pkh', 'wsh']) {
            if (text.startsWith(script)) {
                instance.script = script;
                break;
            }
        }
        text = text.replace(instance.script, '');
        if (text.charAt(text.length - 9) === '#') {
            instance.checksum = text.slice(text.length - 8);
            text = text.slice(0, text.length - 9);
        }
        let scriptParams: string;
        scriptParams = text.slice(1, text.length - 1);
        if (!scriptParams.includes(',')) {
            instance.key = OutputDescriptorKey.from(scriptParams.slice(0, scriptParams.length));
        } else {
            let paramList: string[];
            if (instance.script === 'tr') {
                instance.key = OutputDescriptorKey.from(scriptParams.slice(0, text.indexOf(',') - 1));
                const scriptPath = scriptParams.slice(scriptParams.indexOf(',') + 1);
                paramList = scriptPath.slice(scriptPath.indexOf('(') + 1, scriptPath.indexOf(')')).split(',');
            } else {
                scriptParams = scriptParams.slice(scriptParams.indexOf('(') + 1, scriptParams.length - 1);
                paramList = scriptParams.slice(scriptParams.indexOf('(') + 1, scriptParams.indexOf(')')).split(',');
            }
            instance.threshold = parseInt(paramList[0]);
            paramList.splice(0, 1);
            const outputDescriptorKeyList = paramList.map(descriptorKey => OutputDescriptorKey.from(descriptorKey));
            if (instance.script === 'tr') {
                instance.sortedmultiaParamList = outputDescriptorKeyList;
            } else {
                instance.sortedmultiParamList = outputDescriptorKeyList;
            }
        }

        return instance;
    }

    taprootMultisigDetails(change: number, index: number, network: bitcoinjs.Network) {
        const leafPubkeys = this.sortedmultiaParamList
            .map(outputDescriptorKey => outputDescriptorKey.publicKey(change, index, network))
            .map(publicKey => toXOnly(publicKey))
            .sort((x1, x2) => x1.compare(x2))
            .map(publicKey => publicKey.toString('hex'));

        let leafScriptAsm = `${leafPubkeys[0]} OP_CHECKSIG`;
        for (let i = 1; i < leafPubkeys.length; i++) {
            const publicKey = leafPubkeys[i];
            leafScriptAsm = `${leafScriptAsm} ${publicKey} OP_CHECKSIGADD`;
        }
        leafScriptAsm = `${leafScriptAsm} OP_${this.threshold} OP_NUMEQUAL`;

        const leafScript = bitcoinjs.script.fromASM(leafScriptAsm);
        const scriptTree: Taptree = {
            output: leafScript,
        };
        const redeem = {
            output: leafScript,
            redeemVersion: LEAF_VERSION_TAPSCRIPT,
        };
        return { scriptTree, redeem }
    }

    static scriptFromPurpose(purpose: number) {
        switch (purpose) {
            case 48: return 'wsh';
            case 49: return 'sh(wpkh';
            case 84: return 'wpkh';
            case 86: return 'tr';
        }
    }


    derive(change: number, startIndex: number, endIndex: number, network: bitcoinjs.Network) {
        if (this.sortedmultiaParamList || this.sortedmultiParamList) {
            return this.deriveMultisigList(change, startIndex, endIndex, network);
        }
        return this.deriveSingleSig(change, startIndex, endIndex, network);
    }

    deriveSingleSig(change: number, startIndex: number, endIndex: number, network: bitcoinjs.Network) {
        const derivationDetails = this.key.derivationDetails();

        const extendedkey = this.key.value;
        const accountNode = Bip32Utils.instance.fromBase58(extendedkey, network);
        const changeNode = accountNode.derive(change);
        const derivedArray = Derivator.deriveList(derivationDetails.purpose, changeNode, startIndex, endIndex, network);

        const outputDescriptorKeyList = new Array<OutputDescriptorKey>;
        outputDescriptorKeyList.push(this.key);
        derivedArray.forEach(derived => {
            derived.outputDescriptorKeyList = outputDescriptorKeyList;
            derived.change = change;
        });
        return derivedArray;
    }

    deriveMultisigList(change: number, startIndex: number, endIndex: number, network: bitcoinjs.Network) {
        if (this.sortedmultiaParamList) {
            return this.deriveTaprootMultisigList(change, startIndex, endIndex, network);
        }
        return this.deriveWshMultisigList(change, startIndex, endIndex, network);
    }

    deriveWshMultisigList(change: number, startIndex: number, endIndex: number, network: bitcoinjs.Network) {
        const derivedList = new Array<Derived>;
        for (let i = startIndex; i < endIndex; i++) {
            const publicKeyListSorted = this.sortedmultiParamList.map(outputDescriptorKey => outputDescriptorKey.publicKey(change, i, network)).sort((x1, x2) => x1.compare(x2));
            const payment = Derivator.bip48Payment(this.threshold, publicKeyListSorted, network);
            const derived = new Derived;
            derived.outputDescriptorKeyList = this.sortedmultiParamList;
            derived.change = change;
            derived.address = new Address(payment.address);
            derived.witness = payment.witness;
            derived.index = i;
            derivedList.push(derived);
        }
        return derivedList;
    }

    deriveTaprootMultisigList(change: number, startIndex: number, endIndex: number, network: bitcoinjs.Network) {
        const derivedList = new Array<Derived>;
        for (let i = startIndex; i < endIndex; i++) {
            const taprootMultisigDetails = this.taprootMultisigDetails(change, i, network);
            const payment = bitcoinjs.payments.p2tr({
                internalPubkey: toXOnly(this.key.publicKey(change, i, network)),
                scriptTree: taprootMultisigDetails.scriptTree,
                redeem: taprootMultisigDetails.redeem,
                network: network
            });
            const derived = new Derived;
            derived.outputDescriptorKeyList = [this.key, ...this.sortedmultiaParamList];
            derived.change = change;
            derived.address = new Address(payment.address);
            derived.witness = payment.witness;
            derived.index = i;
            derivedList.push(derived);
        }
        return derivedList;
    }

    toString() {
        let text: string;
        switch (this.script) {
            case 'tr':
                if (this.sortedmultiaParamList) {
                    text = `${this.script}(${this.key},sortedmulti_a(${this.threshold},${this.sortedmultiaParamList.join(',')}))`;
                } else {
                    text = `${this.script}(${this.key})`;
                }
                break;
            case 'wsh':
                text = `${this.script}(sortedmulti(${this.threshold},${this.sortedmultiParamList.join(',')}))`;
                break;
            case 'sh(wpkh':
                text = `${this.script}(${this.key}))`;
                break;
            default:
                text = `${this.script}(${this.key})`;
        }
        const checksumString = this.checksum ? `#${this.checksum}` : '';
        text = `${text}${checksumString}`;
        return text;
    }

}
