import * as bitcoinjs from 'bitcoinjs-lib';
import { LEAF_VERSION_TAPSCRIPT } from 'bitcoinjs-lib/src/payments/bip341';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371';
import { Taptree } from 'bitcoinjs-lib/src/types';
import { Bip32Utils } from './bitcoinjs/bip32.utils';
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
        let scriptParams = text.slice(1, text.length - 1);
        if (!scriptParams.includes(',')) {
            instance.key = OutputDescriptorKey.from(scriptParams.slice(0, scriptParams.length));
        } else {
            if (scriptParams.startsWith('sortedmulti')) {
                scriptParams = scriptParams.slice(scriptParams.indexOf('(') + 1, scriptParams.length - 1);
            }
            let paramList: string[];
            if (instance.script === 'tr') {
                const separatorCommaIndex = scriptParams.indexOf(',');
                instance.key = OutputDescriptorKey.from(scriptParams.slice(0, separatorCommaIndex));
                const scriptPath = scriptParams.slice(separatorCommaIndex + 1);
                paramList = scriptParams.slice(scriptPath.indexOf('(') + 1, scriptPath.indexOf(')')).split(',');
            } else {
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

    details(network: bitcoinjs.Network) {
        const leafPubkeys = this.sortedmultiaParamList
            .map(outputDescriptorKey => {
                const accountNode = Bip32Utils.instance.fromBase58(outputDescriptorKey.value, network);
                const publicKey = accountNode.publicKey;
                if (this.sortedmultiaParamList) {
                    return toXOnly(publicKey);
                }
                return publicKey;
            })
            .map(publicKey => publicKey.toString('hex'));

        let leafScriptAsm = `${leafPubkeys[0]} OP_CHECKSIG`;
        for (const publicKey of leafPubkeys) {
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

    toString() {
        if (this.script === 'wsh') {
            return `${this.script}(sortedmulti(${this.threshold},${this.sortedmultiParamList.join(',')}))`;
        }
        if (this.script === 'sh(wpkh') {
            return `${this.script}(${this.key}))`;
        }
        return `${this.script}(${this.key})`;
    }

}
