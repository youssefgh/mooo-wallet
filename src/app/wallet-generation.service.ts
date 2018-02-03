import {environment} from '../environments/environment';
import {Injectable} from '@angular/core';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as bip39 from 'bip39';

import {Wallet} from './core/wallet';

@Injectable()
export class WalletGenerationService {

    environment = environment;

    constructor() {}

    generateP2pkh(ecPair: bitcoinjs.ECPair) {
        let wallet = new Wallet();
        wallet.address = ecPair.getAddress();
        wallet.wif = ecPair.toWIF();
        return wallet;
    }

    newP2wpkhInP2sh(password: string) {
        let mnemonic = bip39.generateMnemonic();
        let ecPair = this.ecPairFromMnemonic(mnemonic,password);
        let wallet = this.generateP2wpkhInP2sh(ecPair);
        wallet.mnemonic = mnemonic;
        return wallet;
    }

    generateP2wpkhInP2sh(ecPair: bitcoinjs.ECPair) {
        let wallet = new Wallet();
        let pubKey = ecPair.getPublicKeyBuffer();
        let witnessScript = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey));
        let scriptPubKey = bitcoinjs.script.scriptHash.output.encode(bitcoinjs.crypto.hash160(witnessScript));
        wallet.address = bitcoinjs.address.fromOutputScript(scriptPubKey, this.environment.network);
        wallet.wif = ecPair.toWIF();
        return wallet;
    }

    newP2wpkh(password: string) {
        let mnemonic = bip39.generateMnemonic();
        let ecPair = this.ecPairFromMnemonic(mnemonic,password);
        let wallet = this.generateP2wpkh(ecPair);
        wallet.mnemonic = mnemonic;
        return wallet;
    }

    generateP2wpkh(ecPair: bitcoinjs.ECPair) {
        let wallet = new Wallet();
        let pubKey = ecPair.getPublicKeyBuffer();
        let scriptPubKey = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey));
        wallet.address = bitcoinjs.address.fromOutputScript(scriptPubKey, this.environment.network);
        wallet.wif = ecPair.toWIF();
        return wallet;
    }

    isP2pkhAddress(addressToCheck: string, ecPair: bitcoinjs.ECPair) {
        return addressToCheck === this.generateP2pkh(ecPair).address;
    }

    isP2wpkhInP2shAddress(addressToCheck: string, ecPair: bitcoinjs.ECPair) {
        return addressToCheck === this.generateP2wpkhInP2sh(ecPair).address;
    }

    isP2wpkhAddress(addressToCheck: string, ecPair: bitcoinjs.ECPair) {
        return addressToCheck === this.generateP2wpkh(ecPair).address;
    }

    redeemScriptFrom(keyPair: bitcoinjs.ECPair) {
        let pubKey = keyPair.getPublicKeyBuffer();
        let witnessScript = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey))
        return witnessScript;
    }

    isMnemonicMatchAddress(mnemonic: string, password: string, address: string) {
        try {
            let ecPair = this.ecPairFromMnemonic(mnemonic, password)
            return this.isP2pkhAddress(address, ecPair) ||
                this.isP2wpkhInP2shAddress(address, ecPair) ||
                this.isP2wpkhAddress(address, ecPair);
        } catch (e) {
            return false;
        }
    }

//    isWifMatchAddress(mnemonic: string, address: string) {
//        return false;
//    }

    ecPairFromMnemonic(mnemonic: string, password: string) {
        let seed = bip39.mnemonicToSeed(mnemonic, password);
        let hdNode = bitcoinjs.HDNode.fromSeedBuffer(seed, this.environment.network);
        return hdNode.keyPair;
    }

}
