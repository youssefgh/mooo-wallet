import * as bitcoinjs from 'bitcoinjs-lib';

export class Purpose {

    static from(extendedkey: string, network: bitcoinjs.Network) {
        // TODO remove network validation
        const prefix = extendedkey.substr(0, 1);
        let purpose;
        switch (prefix) {
            case 'x':
                if (network === bitcoinjs.networks.bitcoin) {
                    purpose = 44;
                } else {
                    throw new Error('Incompatible network');
                }
                break;
            case 't':
                if (network === bitcoinjs.networks.testnet) {
                    purpose = 44;
                } else {
                    throw new Error('Incompatible network');
                }
                break;
            case 'y':
                if (network === bitcoinjs.networks.bitcoin) {
                    purpose = 49;
                } else {
                    throw new Error('Incompatible network');
                }
                break;
            case 'u':
                if (network === bitcoinjs.networks.testnet) {
                    purpose = 49;
                } else {
                    throw new Error('Incompatible network');
                }
                break;
            case 'z':
                if (network === bitcoinjs.networks.bitcoin) {
                    purpose = 84;
                } else {
                    throw new Error('Incompatible network');
                }
                break;
            case 'v':
                if (network === bitcoinjs.networks.testnet) {
                    purpose = 84;
                } else {
                    throw new Error('Incompatible network');
                }
                break;
            default: throw new Error('Incompatible key');
        }
        return purpose;
    }

}
