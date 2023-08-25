import * as bitcoinjs from 'bitcoinjs-lib';
import { Bip32Utils } from "./bitcoinjs/bip32.utils";

export class OutputDescriptorKey {

    fingerprint: string;
    derivation: string;
    value: string;
    change: string = '<0;1>';

    static from(
        text: string,
    ) {
        const instance = new OutputDescriptorKey();

        text = text.trim();
        if (text.startsWith('[')) {
            const keyOrigin = text.slice(1, text.indexOf(']'));
            instance.fingerprint = keyOrigin.slice(0, 8);
            instance.derivation = keyOrigin.slice(8);
            text = text.slice(text.indexOf(']') + 1);
        }
        if (text.endsWith('*')) {
            text = text.slice(0, text.indexOf('*'));
        }
        if (text.endsWith('/')) {
            text = text.slice(0, text.indexOf('/'));
        }
        if (text.endsWith('/<0;1>')) {
            text = text.slice(0, text.indexOf('/<0;1>'));
        }
        instance.value = text;

        return instance;
    }

    derivationDetails() {
        const derivationList = this.derivation.split('/');
        const purpose = parseInt(derivationList[1].substring(0, derivationList[1].length - 1));
        const coinType = parseInt(derivationList[2].substring(0, derivationList[2].length - 1));
        const account = parseInt(derivationList[3].substring(0, derivationList[3].length - 1));
        let script: number;
        if (derivationList.length > 4) {
            script = parseInt(derivationList[4].substring(0, derivationList[4].length - 1));
        }
        return { purpose, coinType, account, script };
    }

    publicKey(change: number, index: number, network: bitcoinjs.Network) {
        const scriptNode = Bip32Utils.instance.fromBase58(this.value, network);
        const changeNode = scriptNode.derive(change);
        return changeNode.derive(index).publicKey;
    }

    toString() {
        return `[${this.fingerprint}${this.derivation}]${this.value}/${this.change}/*`;
    }

}
