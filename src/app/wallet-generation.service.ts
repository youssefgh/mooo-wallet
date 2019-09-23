import { Injectable } from '@angular/core';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';

import { Wallet } from './core/wallet';
import { Derived } from './core/derived';

@Injectable({
    providedIn: 'root'
})
export class WalletGenerationService {

    constructor() { }

    newP2wpkhInP2sh(passphrase: string, network: bitcoinjs.Network) {
        const purpose = 49
        const account = 0
        let mnemonic = bip39.generateMnemonic()
        let wallet = new Wallet
        const hdRoot = this.hdRootFrom(mnemonic, passphrase, purpose, network)
        const accountNode = hdRoot.deriveHardened(purpose).deriveHardened(this.coinType(network)).deriveHardened(account)
        wallet.xpub = accountNode.neutered().toBase58()
        wallet.mnemonic = mnemonic
        return wallet
    }

    newP2wpkh(passphrase: string, network: bitcoinjs.Network) {
        const purpose = 84
        const account = 0
        let mnemonic = bip39.generateMnemonic()
        let wallet = new Wallet
        const hdRootFrom = this.hdRootFrom(mnemonic, passphrase, purpose, network)
        const accountNode = hdRootFrom.deriveHardened(purpose).deriveHardened(this.coinType(network)).deriveHardened(account)
        wallet.xpub = accountNode.neutered().toBase58()
        wallet.mnemonic = mnemonic
        return wallet
    }

    isMnemonicMatchKey(mnemonic: string, passphrase: string, key: string, network: bitcoinjs.Network) {
        try {
            let purposeArray = [84, 49, 44]
            //TODO support other accounts
            let account = 0
            for (const purpose of purposeArray) {
                let hdRoot = this.hdRootFrom(mnemonic, passphrase, purpose, network)
                let pub = hdRoot.deriveHardened(purpose).deriveHardened(this.coinType(network)).deriveHardened(account).neutered().toBase58()
                if (pub === key) {
                    return true
                }
            }
        } catch (e) {
        }
        return false
    }

    isValidMnemonic(mnemonic: string) {
        return bip39.validateMnemonic(mnemonic)
    }


    hdRootFrom(mnemonic: string, passphrase: string, purpose: number, network: bitcoinjs.Network) {
        const seed = bip39.mnemonicToSeed(mnemonic, passphrase)
        const bip32Network = this.bip32Network(purpose, network)
        return bip32.fromSeed(seed, { wif: network.wif, bip32: bip32Network })
    }

    bip32Network(purpose: number, network: bitcoinjs.Network) {
        const mbip49 = {
            public: 0x049d7cb2,
            private: 0x049d7878
        }
        const tbip49 = {
            public: 0x044a5262,
            private: 0x044a4e28
        }
        const mbip84 = {
            public: 0x04b24746,
            private: 0x04b2430c
        }
        const tbip84 = {
            public: 0x045f1cf6,
            private: 0x045f18bc
        }
        let bip32Network
        switch (purpose) {
            case 44:
                bip32Network = network.bip32
                break
            case 49:
                if (network === bitcoinjs.networks.bitcoin) {
                    bip32Network = mbip49
                } else if (network === bitcoinjs.networks.testnet || network === bitcoinjs.networks.regtest) {
                    bip32Network = tbip49
                }
                break
            case 84:
                if (network === bitcoinjs.networks.bitcoin) {
                    bip32Network = mbip84
                } else if (network === bitcoinjs.networks.testnet || network === bitcoinjs.networks.regtest) {
                    bip32Network = tbip84
                }
                break
            default: throw new Error("Incompatible purpose")
        }
        if (!bip32Network) {
            throw new Error("Incompatible network")
        }
        return bip32Network
    }

    wif(network: bitcoinjs.Network) {
        let wif
        if (network === bitcoinjs.networks.bitcoin) {
            wif = 0x80
        } else if (network === bitcoinjs.networks.testnet || network === bitcoinjs.networks.regtest) {
            wif = 0xef
        } else {
            throw new Error("Incompatible network")
        }
        return wif
    }

    purpose(extendedkey: string, network: bitcoinjs.Network) {
        //TODO remove network validation
        const prefix = extendedkey.substr(0, 1)
        let purpose
        switch (prefix) {
            case 'x':
                if (network === bitcoinjs.networks.bitcoin) {
                    purpose = 44
                } else {
                    throw new Error("Incompatible network")
                }
                break
            case 't':
                if (network === bitcoinjs.networks.testnet) {
                    purpose = 44
                } else {
                    throw new Error("Incompatible network")
                }
                break
            case 'y':
                if (network === bitcoinjs.networks.bitcoin) {
                    purpose = 49
                } else {
                    throw new Error("Incompatible network")
                }
                break
            case 'u':
                if (network === bitcoinjs.networks.testnet) {
                    purpose = 49
                } else {
                    throw new Error("Incompatible network")
                }
                break
            case 'z':
                if (network === bitcoinjs.networks.bitcoin) {
                    purpose = 84
                } else {
                    throw new Error("Incompatible network")
                }
                break
            case 'v':
                if (network === bitcoinjs.networks.testnet) {
                    purpose = 84
                } else {
                    throw new Error("Incompatible network")
                }
                break
            default: throw new Error("Incompatible key")
        }
        return purpose
    }

    coinType(network: bitcoinjs.Network) {
        if (network === bitcoinjs.networks.bitcoin) {
            return 0
        } else {
            return 1
        }
    }

    derive(extendedkey: string, change: number, startIndex: number, endIndex: number, network: bitcoinjs.Network) {
        const purpose = this.purpose(extendedkey, network)
        const wif = this.wif(network)
        const node = bip32.fromBase58(extendedkey, { wif: wif, bip32: this.bip32Network(purpose, network) })
        const changeNode = node.derive(change)
        const derivedArray = this.deriveList(purpose, changeNode, startIndex, endIndex, network)

        const coinType = this.coinType(network)
        derivedArray.forEach(derived => {
            derived.purpose = purpose
            derived.coinType = coinType
            //TODO add multi account support 
            derived.account = 0
            derived.change = change
        })
        return derivedArray
    }

    deriveList(purpose, changeNode, startIndex, endIndex, network: bitcoinjs.Network): Array<Derived> {
        let derivedArray = new Array
        let paymentGenerator
        switch (purpose) {
            case 44: paymentGenerator = this.bip44Payment
                break
            case 49: paymentGenerator = this.bip49Payment
                break
            case 84: paymentGenerator = this.bip84Payment
                break
            default: // TODO print error
                return
        }
        derivedArray = this.deriveBIPList(changeNode, startIndex, endIndex, paymentGenerator, network)
        return derivedArray
    }

    bip44Payment(publicKey: Buffer, network: bitcoinjs.Network) {
        return bitcoinjs.payments.p2pkh({
            pubkey: publicKey,
            network: network
        })
    }

    bip49Payment(publicKey: Buffer, network: bitcoinjs.Network) {
        return bitcoinjs.payments.p2sh({
            redeem: bitcoinjs.payments.p2wpkh({
                pubkey: publicKey,
                network: network
            }),
            network: network
        })
    }

    bip84Payment(publicKey: Buffer, network: bitcoinjs.Network) {
        return bitcoinjs.payments.p2wpkh({
            pubkey: publicKey,
            network: network
        })
    }

    deriveBIP(changeNode: bitcoinjs.bip32.BIP32Interface, index: number, paymentGenerator: Function, network: bitcoinjs.Network) {
        let derived = new Derived
        const publicKey = changeNode.derive(index).publicKey
        const payment = paymentGenerator(publicKey, network)
        derived.address = payment.address
        derived.index = index
        derived.publicKey = publicKey
        return derived
    }

    deriveBIPList(changeNode: bitcoinjs.bip32.BIP32Interface, startIndex: number, endIndex: number, paymentGenerator: Function, network: bitcoinjs.Network) {
        let derivedList = new Array
        for (let i = startIndex; i < endIndex; i++) {
            let derived = this.deriveBIP(changeNode, i, paymentGenerator, network)
            derivedList.push(derived)
        }
        return derivedList
    }

}
