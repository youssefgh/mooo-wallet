import * as bitcoinjs from 'bitcoinjs-lib';
import { Network } from './network';

export class Address {

    value: string;

    static isValid(addressString: string, network: bitcoinjs.Network) {
        try {
            bitcoinjs.address.toOutputScript(addressString, network);
            return true;
        } catch (e) {
            return false;
        }
    }

    static fromOutputScript(outputScript, network: Network) {
        return bitcoinjs.address.fromOutputScript(outputScript, network.value);
    }

    constructor(value: string) {
        this.value = value;
    }

    scriptHash(network: Network) {
        const outputScript = bitcoinjs.address.toOutputScript(this.value, network.value);
        const reversedScriptHash = Buffer.from(bitcoinjs.crypto.sha256(outputScript).reverse());
        return reversedScriptHash.toString('hex');
    }

    toString() {
        return this.value;
    }

}
