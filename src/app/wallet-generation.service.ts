import {environment} from '../environments/environment';
import {Injectable} from '@angular/core';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as bip38 from 'bip38';

import {Wallet} from './core/wallet';

@Injectable()
export class WalletGenerationService {

    environment = environment;

    constructor() {}

    newECPair() {
        return bitcoinjs.ECPair.makeRandom({network: this.environment.network});
    }

    generateP2pkh(ecPair: bitcoinjs.ECPair) {
        let wallet = new Wallet();
        wallet.address = ecPair.getAddress();
        wallet.wif = ecPair.toWIF();
        return wallet;
    }

    newP2wpkhInP2sh() {
        return this.generateP2wpkhInP2sh(this.newECPair());
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

    newP2wpkh() {
        return this.generateP2wpkh(this.newECPair());
    }

    generateP2wpkh(ecPair: bitcoinjs.ECPair) {
        let wallet = new Wallet();
        let pubKey = ecPair.getPublicKeyBuffer();
        let scriptPubKey = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey));
        wallet.address = bitcoinjs.address.fromOutputScript(scriptPubKey, this.environment.network);
        wallet.wif = ecPair.toWIF();
        return wallet;
    }

    encrypt(privateKey: string, passphrase: string) {
        return bip38.encrypt(privateKey, true, passphrase);
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

    isWifMatchAddress(wif: string, address: string) {
        try {
            let ecPair = bitcoinjs.ECPair.fromWIF(wif, this.environment.network);
            return this.isP2pkhAddress(address, ecPair) ||
                this.isP2wpkhInP2shAddress(address, ecPair) ||
                this.isP2wpkhAddress(address, ecPair);
        } catch (e) {
            return false;
        }
    }

}
