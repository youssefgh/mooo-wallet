import { environment } from '../../environments/environment';
import { SendService } from '../send.service';
import { WalletGenerationService } from '../wallet-generation.service';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import * as bitcoinjs from 'bitcoinjs-lib';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Big } from 'big.js';
import { Transaction } from '../core/transaction';
import { Output } from '../core/output';
import { FeeResponse } from '../core/bitcoinfees/fee-response';
import { Fee } from '../core/bitcoinfees/fee';
import { JsonRpcResponse } from '../core/electrum/json-rpc-response';
import { ConversionService } from '../conversion.service';
import { expand } from 'rxjs/operators';
import { Observable, EMPTY } from 'rxjs';
import { BalanceService } from '../balance.service';
import { Derived } from '../core/derived';

declare var M: any;

@Component({
    selector: 'app-send',
    templateUrl: './send.component.html',
    styleUrls: ['./send.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class SendComponent implements OnInit {

    advancedMode: boolean = true

    from: string = ""
    selectedDestination: string
    selectedAmount: number
    changeOutput: Output
    outputArray = new Array<Output>()
    utxoArray = new Array<Transaction>()
    minimumRelayFeeInBtc: number
    transactionHex: string
    balanceBig: Big
    balance: string
    transactionFeeBig: Big
    transactionFee: string
    totalAmountToSend: string
    remainingBalance: string

    mnemonic: string
    passphrase: string
    wif: string
    useWif = false

    minSelectableFee: number
    maxSelectableFee: number
    satoshiPerByte: number
    minimumEstimatedConfirmationTimeInMinute: number
    maximumEstimatedConfirmationTimeInMinute: number
    feeArray: Fee[]

    transaction: bitcoinjs.Transaction

    environment = environment

    keyMatchAddress: boolean

    //TODO move to settings
    gap = 20

    constructor(private sendService: SendService, private balanceService: BalanceService,
        private walletGenerationService: WalletGenerationService, private httpClient: HttpClient,
        private conversionService: ConversionService) { }

    ngOnInit() {
        this.loadFeeArray()
    }

    loadFeeArray() {
        this.httpClient.get<FeeResponse>(environment.bitcoinfeesAddress,
            { headers: new HttpHeaders() })
            .subscribe(feeResponse => {
                this.feeArray = feeResponse.fees
                this.minSelectableFee = 1
                this.maxSelectableFee = 1000
                let defaultFee = this.sendService.feeForEstimatedConfirmationTime(60, this.feeArray)
                this.satoshiPerByte = defaultFee.minFee
                if (this.satoshiPerByte > this.maxSelectableFee) {
                    this.maxSelectableFee = this.satoshiPerByte
                }
                this.minimumEstimatedConfirmationTimeInMinute = defaultFee.minMinutes
                this.maximumEstimatedConfirmationTimeInMinute = defaultFee.maxMinutes
            }, (error: HttpErrorResponse) => {
                M.toast({ html: 'Error while connecting to the proxy server! please try again later' })
                console.error(error)
            })
    }

    isFromValid() {
        const prefix = this.from.substr(1, 3)
        let address
        if (prefix === "pub") {
            return this.isFromValidKey(this.from)
        } else {
            address = this.from
            return this.isFromValidAddress(address)
        }
    }

    isFromValidAddress(address) {
        return this.from !== undefined && this.from !== null &&
            this.sendService.isValidAddress(address, this.environment.network)
    }

    isFromValidKey(key) {
        let change = 0
        try {
            this.walletGenerationService.derive(key, change, 0, 1, environment.network)
            return true
        } catch (e) {
            return false
        }
    }

    loadUTXO() {
        const prefix = this.from.substr(1, 3)
        let address
        if (prefix === "pub" && this.isFromValidKey(this.from)) {
            this.loadUTXOFromKey(this.from)
        } else if (!this.isFromValidAddress(address)) {
            M.toast({ html: 'Incorrect address !' })
        } else {
            let addressList = new Array<string>()
            addressList.push(this.from.toString())
            this.changeOutput = new Output(this.from.toString(), null)
            //TODO enable wif
            // this.loadUTXOFromList(addressList)
        }
    }

    loadUTXOFromList(derivedList: Array<Derived>) {
        this.sendService.loadUTXO(derivedList, environment).subscribe(data => {
            this.sendService.rawTransactionListFrom(data.utxoArray, environment).subscribe(rawTransactionArray => {
                let i = 0
                data.utxoArray.forEach(transaction => {
                    transaction.transactionHex = rawTransactionArray[i]
                    i++
                })
                this.minimumRelayFeeInBtc = data.minimumRelayFeeInBtc
                this.utxoArray = data.utxoArray
                if (this.utxoArray.length === 0) {
                    M.toast({ html: 'This wallet doesn\'t have confirmed balance' })
                    return
                }
                this.updateBalance()
                this.changeOutput.amount = this.balanceBig
            }, (error: HttpErrorResponse) => {
                M.toast({ html: 'Error while connecting to the proxy server! please try again later' })
                M.toast({ html: 'Can\'t list unspent ! Error : ' + error.message })
                console.error(error)
            })
        })
    }

    loadUTXOFromKey(key) {
        let fromIndex = 0
        let gap = this.gap
        let toIndex = gap
        let change = 0
        let repeat
        let derivedList = this.walletGenerationService.derive(key, change, fromIndex, toIndex, environment.network)
        let lastUsedIndex = -1
        let usedDerivedList = new Array
        this.balanceService.loadHistoryFrom(derivedList, environment).pipe(expand((transactionArrayArray) => {
            if (!repeat) {
                if (toIndex - lastUsedIndex >= gap) {
                    if (change === 0) {
                        change = 1
                        fromIndex = 0
                        toIndex = gap
                        lastUsedIndex = -1
                        //     //TODO check change gap
                        //     // gap = 1
                    } else {
                        let changeAddress = this.walletGenerationService.derive(key, change, lastUsedIndex + 1, lastUsedIndex + 2, environment.network)[0].address
                        this.changeOutput = new Output(changeAddress, null)
                        this.loadUTXOFromList(usedDerivedList)
                        return EMPTY
                    }
                }
            }
            //TODO refactor
            if (change === 1 && lastUsedIndex === -1) {
            } else {
                fromIndex = toIndex
                toIndex = lastUsedIndex + gap
            }
            derivedList = this.walletGenerationService.derive(key, change, fromIndex, toIndex, environment.network)
            return this.balanceService.loadHistoryFrom(derivedList, environment)
        })).subscribe(transactionArrayArray => {
            repeat = false
            if (!(transactionArrayArray instanceof Observable)) {
                for (let index = 0; index < transactionArrayArray.length; index++) {
                    const transactionArray = transactionArrayArray[index]
                    if (transactionArray.length !== 0) {
                        usedDerivedList.push(derivedList[index])
                        lastUsedIndex = fromIndex + index
                        repeat = true
                    }
                }
            }
        }, (error: HttpErrorResponse) => {
            // M.toast({ html: 'Error while connecting to the proxy server! please try again later' })
            M.toast({ html: 'Error while getting the balance ! ' + error.message })
            console.error(error)
        })
    }

    removeUTXO(index: number) {
        this.utxoArray.splice(index, 1)
        this.updateBalance()
    }

    addDestination() {
        let selectedAmountBig
        try {
            selectedAmountBig = new Big(this.selectedAmount)
            if (selectedAmountBig.lte(0)) {
                throw new RangeError()
            }
        } catch (e) {
            M.toast({ html: 'Incorrect amount !' })
            return
        }
        let outputToAdd = new Output(this.selectedDestination, selectedAmountBig)
        let newChangeAmount = this.changeOutput.amount.minus(outputToAdd.amount)
        if (newChangeAmount.lt(0)) {
            M.toast({ html: 'Incorrect amount !' })
            return
        } else if (!newChangeAmount.eq(0)) {
            this.changeOutput.amount = newChangeAmount
        } else {
            this.changeOutput.amount = new Big(0)
        }
        this.outputArray.push(outputToAdd)
        this.selectedDestination = null
        this.selectedAmount = null
        if (this.useWif) {
            this.transaction = this.sendService.createWifTransaction(this.outputArray, this.changeOutput, this.utxoArray,
                this.from, this.wif, this.passphrase, environment.network)
        } else {
            this.transaction = this.sendService.createMnemonicTransaction(this.mnemonic, this.passphrase, this.from, this.outputArray, this.changeOutput, this.utxoArray, environment.network)
        }
        this.transactionHex = this.transaction.toHex()
        this.updateTransactionFee()
        this.updateTotalAmountToSend()
        this.updateRemainingBalance()
    }

    removeDestination(index: number) {
        this.changeOutput.amount = this.changeOutput.amount.plus(this.outputArray[index].amount)
        this.outputArray.splice(index, 1)
        if (this.useWif) {
            this.transaction = this.sendService.createWifTransaction(this.outputArray, this.changeOutput, this.utxoArray,
                this.from, this.wif, this.passphrase, environment.network)
        } else {
            this.transaction = this.sendService.createMnemonicTransaction(this.mnemonic, this.passphrase, this.from, this.outputArray, this.changeOutput, this.utxoArray, environment.network)
        }
        this.transactionHex = this.transaction.toHex()
        this.updateTransactionFee()
        this.updateTotalAmountToSend()
        this.updateRemainingBalance()
    }

    updateBalance() {
        this.balanceBig = this.sendService.calculateBalance(this.utxoArray)
        this.balance = parseFloat(this.balanceBig.valueOf()).toFixed(8)
        this.balance = this.sendService.removeTailingZeros(this.balance)
    }

    updateTransactionFee() {
        let feeInSatoshi
        if (this.useWif) {
            let ecPair = this.walletGenerationService.ecPairFromWif(this.wif, this.passphrase, this.environment.network)
            //todo check native segwit
            if (this.walletGenerationService.isP2wpkhAddress(this.from.toString(), ecPair) ||
                this.walletGenerationService.isP2wpkhInP2shAddress(this.from.toString(), ecPair)) {
                let virtualSize = this.transaction.virtualSize()
                feeInSatoshi = virtualSize * this.satoshiPerByte
            } else {
                let byteLength = this.transaction.byteLength()
                feeInSatoshi = byteLength * this.satoshiPerByte
            }
        } else {
            if (this.utxoArray[0].derived.purpose == 49 || this.utxoArray[0].derived.purpose == 84) {
                let virtualSize = this.transaction.virtualSize()
                feeInSatoshi = virtualSize * this.satoshiPerByte
            } else {
                let byteLength = this.transaction.byteLength()
                feeInSatoshi = byteLength * this.satoshiPerByte
            }
        }
        this.transactionFeeBig = this.conversionService.satoshiToBitcoin(feeInSatoshi)
        this.transactionFee = parseFloat(this.transactionFeeBig.valueOf()).toFixed(8)
        this.transactionFee = this.sendService.removeTailingZeros(this.transactionFee)
    }

    updateTotalAmountToSend() {
        let totalAmountToSendBig = new Big(0)
        for (let output of this.outputArray) {
            totalAmountToSendBig = totalAmountToSendBig.plus(output.amount)
        }
        //TODO remove duplication
        let totalAmountToSend = parseFloat(totalAmountToSendBig.valueOf()).toFixed(8)
        this.totalAmountToSend = this.sendService.removeTailingZeros(totalAmountToSend)
    }

    updateRemainingBalance() {
        let remainingBalanceBig
        if (this.changeOutput !== null) {
            remainingBalanceBig = this.changeOutput.amount.minus(this.transactionFeeBig)
        } else {
            remainingBalanceBig = new Big(0).minus(this.transactionFeeBig)
        }
        this.remainingBalance = parseFloat(remainingBalanceBig.valueOf()).toFixed(8)
        this.remainingBalance = this.sendService.removeTailingZeros(this.remainingBalance)
    }

    //TODO rename
    canSend() {
        return this.utxoArray.length > 0
    }

    satoshiPerByteChanged() {
        for (let fee of this.feeArray) {
            if (fee.minFee <= this.satoshiPerByte && fee.maxFee >= this.satoshiPerByte) {
                this.minimumEstimatedConfirmationTimeInMinute = fee.minMinutes
                this.maximumEstimatedConfirmationTimeInMinute = fee.maxMinutes
                break
            }
        }
        this.updateTransactionFee()
        this.updateRemainingBalance()
    }

    isRemainingBalanceNegative() {
        return parseFloat(this.remainingBalance) < 0
    }

    checkKeyMatchAddress() {
        if (this.useWif) {
            this.keyMatchAddress = this.walletGenerationService.isWifMatchAddress(this.wif, this.passphrase, this.from.toString(), this.environment.network)
        } else {
            this.keyMatchAddress = this.walletGenerationService.isMnemonicMatchKey(this.mnemonic, this.passphrase, this.from.toString(), this.environment.network)
        }
    }

    send() {
        let changeOutputMinusFees = new Output(this.changeOutput.destination, this.changeOutput.amount.minus(this.transactionFeeBig))
        //        this.transaction = this.sendService.createTransaction(this.outputArray, changeOutputMinusFees, this.utxoArray,
        //            this.from, this.mnemonic, this.passphrase)
        //        console.log("send wif" + this.wif)
        if (this.useWif) {
            this.transaction = this.sendService.createWifTransaction(this.outputArray, changeOutputMinusFees, this.utxoArray,
                this.from, this.wif, this.passphrase, environment.network)
        } else {
            this.transaction = this.sendService.createMnemonicTransaction(this.mnemonic, this.passphrase, this.from, this.outputArray, changeOutputMinusFees, this.utxoArray, environment.network)
        }
        this.transactionHex = this.transaction.toHex()
        //        console.log(this.transactionHex)
        this.sendService.broadcast(this.transactionHex, environment).subscribe(data => {
            let responseList = new Array<JsonRpcResponse>()
            for (let responseString of data) {
                let response = JsonRpcResponse.from(responseString)
                if (response.error) {
                    M.toast({ html: 'Sending error ! Tx: ' + response.error.message })
                    console.error(response.error)
                    return
                }
                responseList.push(response)
            }
            responseList = responseList.sort((a, b) => a.id > b.id ? 1 : -1)
            let response = responseList[1]
            M.toast({ html: 'Sending complete ! Tx:' + response.result })
            this.clear()
        }, (error: HttpErrorResponse) => {
            M.toast({ html: 'Error while connecting to the proxy server! please try again later' })
            console.error(error)
        })
    }

    // createMnemonicTransaction() {
    //     return this.sendService.createMnemonicTransaction(this.mnemonic, this.passphrase, this.from, this.outputArray
    //         , changeOutputMinusFees, this.utxoArray, environment.network)
    // }

    switchToWif() {
        this.useWif = true
    }

    clear() {
        this.from = ""
        this.selectedDestination = null
        this.selectedAmount = null
        this.changeOutput = null
        this.outputArray = new Array<Output>()
        this.utxoArray = new Array<Transaction>()
        this.transactionHex = null
        this.balanceBig = null
        this.balance = null

        this.transactionFeeBig = null
        this.transactionFee = null
        this.totalAmountToSend = null
        this.remainingBalance = null

        this.mnemonic = null
        this.passphrase = null

        this.transaction = null

        this.keyMatchAddress = false
    }

}
