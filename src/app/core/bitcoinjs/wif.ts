import * as bitcoinjs from 'bitcoinjs-lib';

export class Wif {

    static of(network: bitcoinjs.Network): number {
        let wif;
        if (network === bitcoinjs.networks.bitcoin) {
            wif = 0x80;
        } else if (network === bitcoinjs.networks.testnet || network === bitcoinjs.networks.regtest) {
            wif = 0xef;
        } else {
            throw new Error('Incompatible network');
        }
        return wif;
    }

}
