import * as bitcoinjs from 'bitcoinjs-lib';

export class Network {

    value: bitcoinjs.Network;

    static from(network: bitcoinjs.Network) {
        const instance = new Network;
        instance.value = network;
        return instance;
    }

    toString() {
        return this.value;
    }

}
