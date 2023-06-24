import * as bitcoinjs from 'bitcoinjs-lib';

export class Purpose {

    static from(extendedkey: string, network: bitcoinjs.Network) {
        const prefix = extendedkey.substring(0, 1);
        const prefixDetailList = Purpose.prefixDetailListOf(network);
        for (const prefixDetail of prefixDetailList) {
            if (prefixDetail.prefix === prefix) {
                return prefixDetail.purpose;
            }
        }
        throw new Error('Incompatible key');
    }

    static prefixDetailListOf(network: bitcoinjs.Network) {
        if (network === bitcoinjs.networks.bitcoin) {
            return [{ prefix: 'x', purpose: 86 }, { prefix: 'z', purpose: 84 }, { prefix: 'y', purpose: 49 }];
        } else if (network === bitcoinjs.networks.testnet || network === bitcoinjs.networks.regtest) {
            return [{ prefix: 't', purpose: 86 }, { prefix: 'v', purpose: 84 }, { prefix: 'u', purpose: 49 }];
        }
        throw new Error('Unknow network');
    }

}
