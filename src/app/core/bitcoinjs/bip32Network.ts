import * as bitcoinjs from 'bitcoinjs-lib';

export class Bip32Network {

    static from(purpose: number, network: bitcoinjs.Network) {
        const mbip49 = {
            public: 0x049d7cb2,
            private: 0x049d7878
        };
        const tbip49 = {
            public: 0x044a5262,
            private: 0x044a4e28
        };
        const mbip84 = {
            public: 0x04b24746,
            private: 0x04b2430c
        };
        const tbip84 = {
            public: 0x045f1cf6,
            private: 0x045f18bc
        };
        let bip32Network;
        switch (purpose) {
            case 44:
                bip32Network = network.bip32;
                break;
            case 49:
                if (network === bitcoinjs.networks.bitcoin) {
                    bip32Network = mbip49;
                } else if (network === bitcoinjs.networks.testnet || network === bitcoinjs.networks.regtest) {
                    bip32Network = tbip49;
                }
                break;
            case 84:
                if (network === bitcoinjs.networks.bitcoin) {
                    bip32Network = mbip84;
                } else if (network === bitcoinjs.networks.testnet || network === bitcoinjs.networks.regtest) {
                    bip32Network = tbip84;
                }
                break;
            default: throw new Error('Incompatible purpose');
        }
        if (!bip32Network) {
            throw new Error('Incompatible network');
        }
        return bip32Network;
    }

}
