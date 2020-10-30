import * as bitcoinjs from 'bitcoinjs-lib';

export class HdCoin {

    static id(network: bitcoinjs.Network) {
        if (network === bitcoinjs.networks.bitcoin) {
            return 0;
        } else {
            return 1;
        }
    }

}
