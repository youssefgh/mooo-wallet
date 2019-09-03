import { Injectable } from '@angular/core';
//import * as bitcoinjs from 'bitcoinjs-lib';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import * as bip38 from 'bip38';
import * as wif from 'wif';

import { Wallet } from './core/wallet';
import { Derived } from './core/derived';

@Injectable({
    providedIn: 'root'
})
export class WalletGenerationService {

    constructor() { }

    generateP2pkh(keyPair: bitcoinjs.ECPair.ECPairInterface) {
        let wallet = new Wallet()
        wallet.address = bitcoinjs.payments.p2pkh({ pubkey: keyPair.publicKey, network: keyPair.network }).address
        wallet.wif = keyPair.toWIF()
        return wallet
    }

    newP2wpkhInP2sh(passphrase: string, network: bitcoinjs.Network) {
        const purpose = 49
        const account = 0
        let mnemonic = bip39.generateMnemonic()
        let wallet = new Wallet
        const node = this.nodeFrom(mnemonic, passphrase, purpose, network)
        const accountNode = node.deriveHardened(purpose).deriveHardened(this.coinType(network)).deriveHardened(account)
        wallet.xpub = accountNode.neutered().toBase58()
        wallet.mnemonic = mnemonic
        return wallet
    }

    generateP2wpkhInP2sh(keyPair: bitcoinjs.ECPair.ECPairInterface) {
        let wallet = new Wallet()
        wallet.address = bitcoinjs.payments.p2sh({
            redeem: bitcoinjs.payments.p2wpkh({ pubkey: keyPair.publicKey, network: keyPair.network }), network: keyPair.network
        }).address
        wallet.wif = keyPair.toWIF()
        return wallet
    }

    newP2wpkh(passphrase: string, network: bitcoinjs.Network) {
        const purpose = 84
        const account = 0
        let mnemonic = bip39.generateMnemonic()
        // let ecPair = this.ecPairFromMnemonic(mnemonic, passphrase, network)
        let wallet = new Wallet
        const node = this.nodeFrom(mnemonic, passphrase, purpose, network)
        const accountNode = node.deriveHardened(purpose).deriveHardened(this.coinType(network)).deriveHardened(account)
        wallet.xpub = accountNode.neutered().toBase58()
        // this.xpriv = accountNode.toBase58()
        wallet.mnemonic = mnemonic
        return wallet
    }

    generateP2wpkh(keyPair: bitcoinjs.ECPair.ECPairInterface) {
        let wallet = new Wallet()
        wallet.address = bitcoinjs.payments.p2wpkh({ pubkey: keyPair.publicKey, network: keyPair.network }).address
        wallet.wif = keyPair.toWIF()
        return wallet
    }

    isP2pkhAddress(addressToCheck: string, ecPair: bitcoinjs.ECPair.ECPairInterface) {
        return addressToCheck === this.generateP2pkh(ecPair).address
    }

    isP2wpkhInP2shAddress(addressToCheck: string, ecPair: bitcoinjs.ECPair.ECPairInterface) {
        return addressToCheck === this.generateP2wpkhInP2sh(ecPair).address
    }

    isP2wpkhAddress(addressToCheck: string, ecPair: bitcoinjs.ECPair.ECPairInterface) {
        return addressToCheck === this.generateP2wpkh(ecPair).address
    }

    isMnemonicMatchKey(mnemonic: string, passphrase: string, key: string, network: bitcoinjs.Network) {
        try {
            // let ecPair = this.ecPairFromMnemonic(mnemonic, passphrase, network)
            // return this.isP2pkhAddress(address, ecPair) ||
            //     this.isP2wpkhInP2shAddress(address, ecPair) ||
            //     this.isP2wpkhAddress(address, ecPair)
            let purposeArray = [84, 49, 44]
            //TODO support other accounts
            let account = 0
            for (const purpose of purposeArray) {
                let node = this.nodeFrom(mnemonic, passphrase, purpose, network)
                let pub = node.deriveHardened(purpose).deriveHardened(this.coinType(network)).deriveHardened(account).neutered().toBase58()
                if (pub === key) {
                    return true
                }
            }
        } catch (e) {
        }
        return false
    }

    isWifMatchAddress(wif: string, passphrase: string, address: string, network: bitcoinjs.Network) {
        try {
            let ecPair = this.ecPairFromWif(wif, passphrase, network)
            return this.isP2pkhAddress(address, ecPair) ||
                this.isP2wpkhInP2shAddress(address, ecPair) ||
                this.isP2wpkhAddress(address, ecPair)
        } catch (e) {
            console.info(e)
            return false
        }
    }

    // ecPairFromMnemonic(mnemonic: string, passphrase: string, network: bitcoinjs.Network) {
    //     let seed = bip39.mnemonicToSeed(mnemonic, passphrase)
    //     let hdNode = bip32.fromSeed(seed, network)
    //     let keyPair = bitcoinjs.ECPair.fromWIF(hdNode.toWIF(), network)
    //     return keyPair
    // }

    ecPairFromWif(wifString: string, passphrase: string, network: bitcoinjs.Network) {
        console.log("ecPairFromWifaa")
        console.log(wifString)
        console.log(passphrase)
        let decryptedWif
        if (wifString.startsWith("3P")) {
            let decryptedKey = bip38.decrypt(wifString, passphrase)
            decryptedWif = wif.encode(network.wif, decryptedKey.privateKey, decryptedKey.compressed)
        } else {
            decryptedWif = wifString
        }
        console.log("1")
        console.log(decryptedWif)
        console.log("end")

        //                let decryptedKey = bip38.decrypt("6PRVWUbkzzsbcVac2qwfssoUJAN1Xhrg6bNk8J7Nzm5H7kxEbn2Nh2ZoGg", "TestingOneTwoThree")
        //                let decryptedWif = wif.encode(bitcoinjs.networks.bitcoin.wif, decryptedKey.privateKey, decryptedKey.compressed)
        //        
        //                console.log(decryptedWif)

        //        let ecPair = bitcoinjs.ECPair.fromWIF(wifString, network)
        //        try {
        let ecPair = bitcoinjs.ECPair.fromWIF(decryptedWif, network)
        return ecPair
        //        } catch (e) {
        //            console.log("Wrong key")
        //        }
        //        return null
    }

    nodeFrom(mnemonic: string, passphrase: string, purpose: number, network: bitcoinjs.Network) {
        const seed = bip39.mnemonicToSeed(mnemonic, passphrase)
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
            case 44: bip32Network = network.bip32
                break
            case 49:
                if (network === bitcoinjs.networks.bitcoin) {
                    bip32Network = mbip49
                } else {
                    bip32Network = tbip49
                }
                break
            case 84:
                if (network === bitcoinjs.networks.bitcoin) {
                    bip32Network = mbip84
                } else {
                    bip32Network = tbip84
                }
                break
        }
        return bip32.fromSeed(seed, { wif: network.wif, bip32: bip32Network })
    }

    nodeFromKey(key: string, network: bitcoinjs.Network) {
        const prefix = key.substr(0, 1)
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
        let purpose
        // let wif
        switch (prefix) {
            case 'x':
                if (network === bitcoinjs.networks.bitcoin) {
                    bip32Network = network.bip32
                    // wif = bitcoinjs.networks.bitcoin.wif
                    purpose = 44
                } else {
                    throw new Error("Incompatible network")
                }
                break
            case 't':
                if (network === bitcoinjs.networks.testnet) {
                    bip32Network = network.bip32
                    // wif = bitcoinjs.networks.testnet.wif
                    purpose = 44
                } else {
                    throw new Error("Incompatible network")
                }
                break
            case 'y':
                if (network === bitcoinjs.networks.bitcoin) {
                    bip32Network = mbip49
                    // wif = 0x80
                    purpose = 49
                } else {
                    throw new Error("Incompatible network")
                }
                break
            case 'u':
                if (network === bitcoinjs.networks.testnet) {
                    bip32Network = tbip49
                    // wif = 0xef
                    purpose = 49
                } else {
                    throw new Error("Incompatible network")
                }
                break
            case 'z':
                if (network === bitcoinjs.networks.bitcoin) {
                    bip32Network = mbip84
                    // wif = 0x80
                    purpose = 84
                } else {
                    throw new Error("Incompatible network")
                }
                break
            case 'v':
                if (network === bitcoinjs.networks.testnet) {
                    bip32Network = tbip84
                    // wif = 0xef
                    purpose = 84
                } else {
                    throw new Error("Incompatible network")
                }
                break
            default: throw new Error("Incompatible key")
        }
        return { node: bip32.fromBase58(key, { wif: network.wif, bip32: bip32Network }), purpose: purpose }
    }

    coinType(network: bitcoinjs.Network) {
        if (network === bitcoinjs.networks.bitcoin) {
            return 0
        } else {
            return 1
        }
    }

    derive(key: string, change: number, startIndex: number, endIndex: number, network: bitcoinjs.Network) {
        let nodeAndPurpose
        try {
            nodeAndPurpose = this.nodeFromKey(key, network)
        } catch (e) {
            //TODO review
            console.error(e)
            throw e
        }
        let changeNode = nodeAndPurpose.node.derive(change)

        let derivedArray = this.deriveList(nodeAndPurpose.purpose, changeNode, startIndex, endIndex, network)

        derivedArray.forEach(derived => {
            derived.purpose = nodeAndPurpose.purpose
            derived.change = change
        })
        return derivedArray
    }

    indexNodeFromMnemonic(mnemonic: string, passphrase: string, xpub: string, derived: Derived, network: bitcoinjs.Network) {
        const node = this.nodeFrom(mnemonic, passphrase, derived.purpose, network)
        let coinType = this.coinType(network)
        //TODO support other accounts
        let account = 0
        const accountNode = node.deriveHardened(derived.purpose).deriveHardened(coinType).deriveHardened(account)
        // const accountNode = node.deriveHardened(derived.purpose).deriveHardened(derived.coinType).deriveHardened(derived.account)
        // let xpub = accountNode.neutered().toBase58()
        // let xpriv = accountNode.toBase58()
        let changeNode = accountNode.derive(derived.change)
        let indexNode = changeNode.derive(derived.index)
        let wif = indexNode.toWIF()
        return indexNode
    }

    deriveList(purpose, changeNode, startIndex, endIndex, network: bitcoinjs.Network): Array<Derived> {
        let derivedArray = new Array
        let addressDerivator
        switch (purpose) {
            case 44: addressDerivator = this.deriveBIP44Address
                break
            case 49: addressDerivator = this.deriveBIP49Address
                break
            case 84: addressDerivator = this.deriveBIP84Address
                break
            default: // TODO print error
                return
        }
        derivedArray = this.deriveBIPList(changeNode, startIndex, endIndex, addressDerivator, network)
        return derivedArray
    }

    deriveBIP44Address(changeNode: bitcoinjs.bip32.BIP32Interface, index: number, network: bitcoinjs.Network) {
        const address = bitcoinjs.payments.p2pkh({
            pubkey: changeNode.derive(index).publicKey,
            network: network
        }).address
        return address
    }

    deriveBIP49Address(changeNode: bitcoinjs.bip32.BIP32Interface, index: number, network: bitcoinjs.Network) {
        const address = bitcoinjs.payments.p2sh({
            redeem: bitcoinjs.payments.p2wpkh({
                pubkey: changeNode.derive(index).publicKey,
                network: network
            }),
            network: network
        }).address
        return address
    }

    deriveBIP84Address(changeNode: bitcoinjs.bip32.BIP32Interface, index: number, network: bitcoinjs.Network) {
        const address = bitcoinjs.payments.p2wpkh({
            pubkey: changeNode.derive(index).publicKey,
            network: network
        }).address
        return address
    }

    deriveBIP(changeNode: bitcoinjs.bip32.BIP32Interface, index: number, addressDerivator: Function, network: bitcoinjs.Network) {
        let derived = new Derived
        const address = addressDerivator(changeNode, index, network)
        derived.address = address
        derived.index = index
        if (changeNode.privateKey) {
            derived.wif = changeNode.derive(index).toWIF()
        }
        return derived
    }

    deriveBIPList(changeNode: bitcoinjs.bip32.BIP32Interface, startIndex: number, endIndex: number, addressDerivator: Function, network: bitcoinjs.Network) {
        let derivedList = new Array
        for (let i = startIndex; i < endIndex; i++) {
            let derived = this.deriveBIP(changeNode, i, addressDerivator, network)
            derivedList.push(derived)
        }
        return derivedList
    }

}
