import {environment} from '../environments/environment';
import {WalletGenerationService} from './wallet-generation.service';
import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpErrorResponse} from '@angular/common/http';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as Wif from 'wif';
import {Big} from 'big.js';
import {Transaction} from './core/transaction';
import {Call} from './core/electrum/call';
import {Procedure} from './core/electrum/procedure';
import {Output} from './core/output';
import {Fee} from './core/bitcoinfees/fee';

@Injectable()
export class SendService {

    environment = environment;

    constructor(private walletGenerationService: WalletGenerationService,
        private httpClient: HttpClient) {}

    calculateBalance(utxoArray: Transaction[]) {
        let balance = new Big(0);
        for (let utxo of utxoArray) {
            balance = balance.plus(this.satoshiToBitcoin(utxo.satoshis));
            balance.plus(new Big(0));
        }
        return balance;
    }

    feeForEstimatedConfirmationTime(minutes: number, feeArray: Fee[]) {
        for (let fee of feeArray) {
            if (fee.maxMinutes < 60) {
                return fee;
            }
        }
    }

    satoshiToBitcoin(satoshi: number): Big {
        return new Big(satoshi).times(new Big(0.00000001));
    }

    removeTailingZeros(text: string) {
        while (text[text.length - 1] === "0") {
            text = text.substring(0, text.length - 1)
        }
        if (text[text.length - 1] === ".") {
            text = text.substring(0, text.length - 1)
        }
        return text;
    }

    isValidAddress(addressString: string, network: bitcoinjs.Network) {
        try {
            bitcoinjs.address.toOutputScript(addressString, network);
            return true;
        } catch (e) {
            return false;
        }
    }

    createTransaction(outputArray: Output[], changeOutput: Output, utxoArray: Transaction[], from: string, wif: string) {
        let transactionBuilder = new bitcoinjs.TransactionBuilder(this.environment.network);
        for (let i = 0; i < outputArray.length; i++) {
            let output = outputArray[i];
            transactionBuilder.addOutput(output.destination, output.amountInSatochi());
        }
        if (changeOutput !== null) {
            transactionBuilder.addOutput(changeOutput.destination, changeOutput.amountInSatochi());
        }
        let ecPair = bitcoinjs.ECPair.fromWIF(wif, this.environment.network);
        if (this.walletGenerationService.isP2wpkhAddress(from, ecPair)) {
            let pubKeyHash = bitcoinjs.crypto.hash160(ecPair.getPublicKeyBuffer())
            let scriptPubKey = bitcoinjs.script.witnessPubKeyHash.output.encode(pubKeyHash)
            for (let i = 0; i < utxoArray.length; i++) {
                let utxo = utxoArray[i];
                transactionBuilder.addInput(utxo.id, utxo.vout, null, scriptPubKey);
            }
            for (let i = 0; i < utxoArray.length; i++) {
                let utxo = utxoArray[i];
                transactionBuilder.sign(i, ecPair, null, null, utxo.satoshis);
            }
        } else if (this.walletGenerationService.isP2wpkhInP2shAddress(from, ecPair)) {
            for (let i = 0; i < utxoArray.length; i++) {
                let utxo = utxoArray[i];
                transactionBuilder.addInput(utxo.id, utxo.vout);
            }
            for (let i = 0; i < utxoArray.length; i++) {
                let utxo = utxoArray[i];
                transactionBuilder.sign(i, ecPair, this.walletGenerationService.redeemScriptFrom(ecPair), null, utxo.satoshis);
            }
        } else if (this.walletGenerationService.isP2pkhAddress(from, ecPair)) {
            for (let i = 0; i < utxoArray.length; i++) {
                let utxo = utxoArray[i];
                transactionBuilder.addInput(utxo.id, utxo.vout);
            }
            for (let i = 0; i < utxoArray.length; i++) {
                transactionBuilder.sign(i, ecPair);
            }
        } else {
            throw new Error('Spending from this address is unsupported');
        }
        let transaction = transactionBuilder.build();
        return transaction;
    }

    loadUTXO(address: string) {
        let call = new Call(environment.electrumServer, environment.electrumPort);
        let procedure = new Procedure(1, "server.version");
        procedure.params.push(environment.electrumProtocol);
        procedure.params.push(environment.electrumProtocol);
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(1, "blockchain.headers.subscribe");
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(1, "blockchain.relayfee");
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(1, "blockchain.scripthash.listunspent");
        procedure.params.push(this.scriptHashFrom(address));
        call.procedureList.push(procedure.toString());
        return this.httpClient.post<any[]>(environment.proxyAddress + '/tcp-rest-proxy/api/proxy', call);
    }

    scriptHashFrom(addressString: string) {
        let scriptHash = bitcoinjs.address.toOutputScript(addressString, this.environment.network);
        let reversedScriptHash = new Buffer(bitcoinjs.crypto.sha256(scriptHash).reverse());
        return reversedScriptHash.toString("hex");
    }

    broadcast(transaction: string) {
        let call = new Call(environment.electrumServer, environment.electrumPort);
        let procedure = new Procedure(1, "server.version");
        procedure.params.push(environment.electrumProtocol);
        procedure.params.push(environment.electrumProtocol);
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(1, "blockchain.transaction.broadcast");
        procedure.params.push(transaction);
        call.procedureList.push(procedure.toString());
        return this.httpClient.post<any[]>(environment.proxyAddress + '/tcp-rest-proxy/api/proxy', call);
    }

}
