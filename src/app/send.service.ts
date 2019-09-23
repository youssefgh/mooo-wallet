import { WalletGenerationService } from './wallet-generation.service';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import { Big } from 'big.js';
import { Transaction } from './core/transaction';
import { Call } from './core/electrum/call';
import { Procedure } from './core/electrum/procedure';
import { Output } from './core/output';
import { Fee } from './core/bitcoinfees/fee';
import { ConversionService } from './conversion.service';
import { map } from 'rxjs/operators';
import { JsonRpcResponse } from './core/electrum/json-rpc-response';
import { throwError } from 'rxjs';
import { Derived } from './core/derived';

@Injectable({
    providedIn: 'root'
})
export class SendService {

    constructor(private httpClient: HttpClient, private walletGenerationService: WalletGenerationService,
        private conversionService: ConversionService) { }

    calculateBalance(utxoArray: Transaction[]) {
        let balance = new Big(0)
        for (let utxo of utxoArray) {
            balance = balance.plus(utxo.satoshis)
            balance.plus(new Big(0))
        }
        return balance
    }

    feeForEstimatedConfirmationTime(minutes: number, feeArray: Fee[]) {
        for (let fee of feeArray) {
            if (fee.maxMinutes < 60) {
                return fee
            }
        }
    }

    isValidAddress(addressString: string, network: bitcoinjs.Network) {
        try {
            bitcoinjs.address.toOutputScript(addressString, network)
            return true
        } catch (e) {
            return false
        }
    }

    createPsbt(outputArray: Output[], changeOutput: Output, utxoArray: Transaction[], network: bitcoinjs.Network) {
        const psbt = new bitcoinjs.Psbt({ network: network })
        for (let i = 0; i < utxoArray.length; i++) {
            const utxo = utxoArray[i]
            const bip32Derivation = utxo.derived.bip32Derivation()
            if (utxo.derived.purpose === 84) {
                const transaction = bitcoinjs.Transaction.fromHex(utxo.transactionHex)
                psbt.addInput({
                    hash: utxo.id,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: transaction.outs[utxo.vout].script,
                        value: utxo.satoshis
                    },
                    bip32Derivation: [
                        bip32Derivation
                    ]
                })
            } else if (utxo.derived.purpose === 49) {
                const p2wpkh = bitcoinjs.payments.p2wpkh({ pubkey: utxo.derived.publicKey, network: network })
                const p2sh = bitcoinjs.payments.p2sh({ redeem: p2wpkh, network: network })
                const transaction = bitcoinjs.Transaction.fromHex(utxo.transactionHex)
                psbt.addInput({
                    hash: utxo.id,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: transaction.outs[utxo.vout].script,
                        value: utxo.satoshis
                    },
                    redeemScript: p2sh.redeem.output,
                    bip32Derivation: [
                        bip32Derivation
                    ]
                })
            } else if (utxo.derived.purpose === 44) {
                psbt.addInput({
                    hash: utxo.id,
                    index: utxo.vout,
                    nonWitnessUtxo: Buffer.from(utxo.transactionHex, 'hex'),
                    bip32Derivation: [
                        bip32Derivation
                    ]
                })
            } else {
                throw new Error("Incompatible purpose " + utxo.derived.purpose)
            }
        }
        for (let i = 0; i < outputArray.length; i++) {
            let output = outputArray[i]
            psbt.addOutput({ address: output.destination, value: output.amount })
        }
        if (changeOutput.amount !== 0) {
            psbt.addOutput({ address: changeOutput.destination, value: changeOutput.amount })
        }
        return psbt
    }

    transactionFee(transaction: bitcoinjs.Transaction, utxoArray: Array<Transaction>, satoshiPerByte: number) {
        let feeInSatoshi
        if (utxoArray[0].derived.purpose == 49 || utxoArray[0].derived.purpose == 84) {
            let virtualSize = transaction.virtualSize()
            feeInSatoshi = virtualSize * satoshiPerByte
        } else {
            let byteLength = transaction.byteLength()
            feeInSatoshi = byteLength * satoshiPerByte
        }
        return feeInSatoshi
    }

    signPsbtHex(mnemonic: string, passphrase: string, base64: string, network: bitcoinjs.Network) {
        const psbt = bitcoinjs.Psbt.fromBase64(base64, { network: network })
        return this.signPsbt(mnemonic, passphrase, psbt, network)
    }

    signPsbt(mnemonic: string, passphrase: string, psbt: bitcoinjs.Psbt, network: bitcoinjs.Network) {
        const seed = bip39.mnemonicToSeed(mnemonic, passphrase)
        const hdRoot = bitcoinjs.bip32.fromSeed(seed, network)
        for (let index = 0; index < psbt.inputCount; index++) {
            (psbt as any).data.inputs[index].bip32Derivation[0].masterFingerprint = hdRoot.fingerprint
        }
        psbt.signAllInputsHD(hdRoot)
        if (!psbt.validateSignaturesOfAllInputs()) {
            throw new Error("Invalid signature")
        }
        psbt.finalizeAllInputs()
    }

    loadUTXO(derivedList: Array<Derived>, environment) {
        let call = new Call(environment.electrumServer, environment.electrumPort)
        let procedure = new Procedure(1, "server.version")
        procedure.params.push(environment.electrumProtocol)
        procedure.params.push(environment.electrumProtocol)
        call.procedureList.push(procedure.toString())
        procedure = new Procedure(2, "blockchain.headers.subscribe")
        call.procedureList.push(procedure.toString())
        procedure = new Procedure(3, "blockchain.relayfee")
        call.procedureList.push(procedure.toString())
        let i = 4
        derivedList.forEach(derived => {
            procedure = new Procedure(i, "blockchain.scripthash.listunspent")
            procedure.params.push(this.scriptHashFrom(derived.address, environment))
            call.procedureList.push(procedure.toString())
            i++
        })
        return this.httpClient.post<any[]>(environment.proxyAddress + '/api/proxy', call).pipe(map((data => {
            let responseList = new Array<JsonRpcResponse>()
            for (let responseString of data) {
                let response = JsonRpcResponse.from(responseString)
                if (response.error) {
                    throwError(response.error)
                }
                responseList.push(response)
            }
            responseList = responseList.sort((a, b) => a.id > b.id ? 1 : -1)
            let lastBlockHeight: number = responseList[1].result.height
            let minimumRelayFeeInBtc = responseList[2].result
            let utxoArray = new Array<Transaction>()
            for (let index = 3; index < responseList.length; index++) {
                const utxoList = responseList[index].result
                for (let item of utxoList) {
                    let utxo = new Transaction()
                    utxo.id = item.tx_hash
                    utxo.vout = item.tx_pos
                    utxo.satoshis = item.value
                    utxo.height = item.height
                    //TODO use big
                    utxo.amount = parseFloat(this.conversionService.satoshiToBitcoin(utxo.satoshis).toFixed(8))
                    utxo.derived = derivedList[index - 3]
                    if (utxo.height > 0)
                        utxo.confirmations = lastBlockHeight - utxo.height + 1
                    else
                        utxo.confirmations = 0
                    utxoArray.push(utxo)
                }
                utxoArray = utxoArray.filter((utxo: Transaction) => utxo.confirmations > 0)
            }
            return { 'minimumRelayFeeInBtc': minimumRelayFeeInBtc, 'utxoArray': utxoArray }
        })))
    }

    rawTransactionListFrom(utxoArray: Array<Transaction>, environment) {
        let call = new Call(environment.electrumServer, environment.electrumPort)
        let procedure = new Procedure(1, "server.version")
        procedure.params.push(environment.electrumProtocol)
        procedure.params.push(environment.electrumProtocol)
        call.procedureList.push(procedure.toString())
        let i = 1
        utxoArray.forEach(transaction => {
            procedure = new Procedure(++i, "blockchain.transaction.get")
            procedure.params.push(transaction.id)
            call.procedureList.push(procedure.toString())
        })
        return this.httpClient.post<string[]>(environment.proxyAddress + '/api/proxy', call).pipe(map(data => {
            data = data.map(d => JSON.parse(d))
                .sort((a, b) => a.id > b.id ? 1 : -1)
                .slice(1)
                .map(d => d.result)
            return data
        }))
    }

    scriptHashFrom(addressString: string, environment) {
        let outputScript = bitcoinjs.address.toOutputScript(addressString, environment.network)
        let reversedScriptHash = new Buffer(bitcoinjs.crypto.sha256(outputScript).reverse())
        return reversedScriptHash.toString("hex")
    }

    broadcast(transaction: string, environment) {
        let call = new Call(environment.electrumServer, environment.electrumPort)
        let procedure = new Procedure(1, "server.version")
        procedure.params.push(environment.electrumProtocol)
        procedure.params.push(environment.electrumProtocol)
        call.procedureList.push(procedure.toString())
        procedure = new Procedure(2, "blockchain.transaction.broadcast")
        procedure.params.push(transaction)
        call.procedureList.push(procedure.toString())
        return this.httpClient.post<any[]>(environment.proxyAddress + '/api/proxy', call)
    }

}
