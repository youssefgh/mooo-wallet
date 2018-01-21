import {environment} from '../../environments/environment';
import {SendService} from '../send.service';
import {WalletGenerationService} from '../wallet-generation.service';
import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import * as bitcoinjs from 'bitcoinjs-lib';
import {HttpClient, HttpHeaders, HttpErrorResponse} from '@angular/common/http';
import {Big} from 'big.js';
import {Transaction} from '../core/transaction';
import {Output} from '../core/output';
import {FeeResponse} from '../core/bitcoinfees/fee-response';
import {Fee} from '../core/bitcoinfees/fee';
import {JsonRpcResponse} from '../core/electrum/json-rpc-response';

declare var M: any;

@Component({
    selector: 'app-send',
    templateUrl: './send.component.html',
    styleUrls: ['./send.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class SendComponent implements OnInit {

    advancedMode: boolean = false;

    from: string;
    selectedDestination: string;
    selectedAmount: number;
    changeOutput: Output;
    outputArray: Output[] = new Array<Output>();
    utxoArray: Transaction[] = new Array<Transaction>();
    minimumRelayFeeInBtc: number;
    transactionHex: string;
    balanceBig: Big;
    balance: string;
    transactionFeeBig: Big;
    transactionFee: string;
    totalAmountToSend: string;
    remainingBalance: string;

    wif: string;

    minSelectableFee: number;
    maxSelectableFee: number;
    satoshiPerByte: number;
    minimumEstimatedConfirmationTimeInMinute: number;
    maximumEstimatedConfirmationTimeInMinute: number;
    feeArray: Fee[];

    transaction: bitcoinjs.Transaction;

    environment = environment;

    wifMatchAddress: boolean;

    constructor(private sendService: SendService,
        private walletGenerationService: WalletGenerationService, private httpClient: HttpClient) {}

    ngOnInit() {
        this.loadFeeArray();
    }

    loadUTXO() {
        if (this.from === null || !this.isFromValid()) {
            M.toast({html: 'Incorrect address !'});
            return;
        }
        this.sendService.loadUTXO(this.from.toString()).subscribe(data => {
            let responseList = new Array<JsonRpcResponse>();
            for (let responseString of data) {
                let response = JsonRpcResponse.from(responseString);
                if (response.error) {
                    M.toast({html: 'Can\'t list unspent ! Error : ' + response.error.message});
                    console.error(response.error);
                    return;
                }
                responseList.push(response);
            }
            let lastBlockHeight: number = responseList[1].result.block_height;
            this.minimumRelayFeeInBtc = responseList[2].result;
            for (let item of responseList[3].result) {
                let utxo = new Transaction();
                utxo.id = item.tx_hash;
                utxo.vout = item.tx_pos;
                utxo.satoshis = item.value;
                utxo.height = item.height;
                if (utxo.height != 0)
                    utxo.confirmations = lastBlockHeight - utxo.height + 1;
                else
                    utxo.confirmations = 0;
                this.utxoArray.push(utxo);
            }
            this.utxoArray = this.utxoArray.filter((utxo: Transaction) => utxo.confirmations > 0);
            this.updateBalance();
            this.changeOutput = new Output(this.from.toString(), this.balanceBig);
        }, (error: HttpErrorResponse) => {
            M.toast({html: 'Error while connecting to the proxy server! please try again later'});
            console.error(error);
        });
    }

    loadFeeArray() {
        this.httpClient.get<FeeResponse>(environment.bitcoinfeesAddress,
            {headers: new HttpHeaders()})
            .subscribe(feeResponse => {
                this.feeArray = feeResponse.fees;
                this.minSelectableFee = 1;
                this.maxSelectableFee = 1000;
                let defaultFee = this.sendService.feeForEstimatedConfirmationTime(60, this.feeArray);
                this.satoshiPerByte = defaultFee.minFee;
                if (this.satoshiPerByte > this.maxSelectableFee) {
                    this.maxSelectableFee = this.satoshiPerByte;
                }
                this.minimumEstimatedConfirmationTimeInMinute = defaultFee.minMinutes;
                this.maximumEstimatedConfirmationTimeInMinute = defaultFee.maxMinutes;
            }, (error: HttpErrorResponse) => {
                M.toast({html: 'Error while connecting to the proxy server! please try again later'});
                console.error(error);
            });
    }

    removeUTXO(index: number) {
        //        this.utxoArray.splice(index, 1);
        //        this.updateBalance();
    }

    addDestination() {
        let selectedAmountBig;
        try {
            selectedAmountBig = new Big(this.selectedAmount);
            if (selectedAmountBig.lte(0)) {
                throw new RangeError();
            }
        } catch (e) {
            M.toast({html: 'Incorrect amount !'});
            return;
        }
        let outputToAdd = new Output(this.selectedDestination, selectedAmountBig);
        let newChangeAmount = this.changeOutput.amount.minus(outputToAdd.amount);
        if (newChangeAmount.lt(0)) {
            M.toast({html: 'Incorrect amount !'});
            return;
        }
        if (!newChangeAmount.eq(0)) {
            this.changeOutput.amount = newChangeAmount;
        } else {
            this.changeOutput = null;
        }
        this.outputArray.push(outputToAdd);
        this.selectedDestination = null;
        this.selectedAmount = null;
        this.transaction = this.sendService.createTransaction(this.outputArray, this.changeOutput, this.utxoArray,
            this.from, this.wif);
        this.transactionHex = this.transaction.toHex();
        this.updateTransactionFee();
        this.updateTotalAmountToSend();
        this.updateRemainingBalance();
    }

    removeDestination(index: number) {
        if (this.changeOutput !== null) {
            this.changeOutput.amount = this.changeOutput.amount.plus(this.outputArray[index].amount);
        } else {
            //TODO test
            this.changeOutput = this.outputArray[index];
        }
        this.outputArray.splice(index, 1);
        this.transaction = this.sendService.createTransaction(this.outputArray, this.changeOutput, this.utxoArray,
            this.from, this.wif);
        this.transactionHex = this.transaction.toHex();
        this.updateTransactionFee();
        this.updateTotalAmountToSend();
        this.updateRemainingBalance();
    }

    updateBalance() {
        this.balanceBig = this.sendService.calculateBalance(this.utxoArray);
        this.balance = parseFloat(this.balanceBig.valueOf()).toFixed(8);
        this.balance = this.sendService.removeTailingZeros(this.balance);
    }

    updateTransactionFee() {
        let ecPair = bitcoinjs.ECPair.fromWIF(this.wif, this.environment.network);
        let feeInSatoshi;
        if (this.walletGenerationService.isP2wpkhInP2shAddress(this.from.toString(), ecPair)) {
            let virtualSize = this.transaction.virtualSize();
            feeInSatoshi = virtualSize * this.satoshiPerByte;
        } else {
            let byteLength = this.transaction.byteLength();
            feeInSatoshi = byteLength * this.satoshiPerByte;
        }
        this.transactionFeeBig = this.sendService.satoshiToBitcoin(feeInSatoshi);
        this.transactionFee = parseFloat(this.transactionFeeBig.valueOf()).toFixed(8);
        this.transactionFee = this.sendService.removeTailingZeros(this.transactionFee);
    }

    updateTotalAmountToSend() {
        let totalAmountToSendBig = new Big(0);
        for (let output of this.outputArray) {
            totalAmountToSendBig = totalAmountToSendBig.plus(output.amount);
        }
        //TODO remove duplication
        this.totalAmountToSend = parseFloat(totalAmountToSendBig.valueOf()).toFixed(8);
        this.totalAmountToSend = this.sendService.removeTailingZeros(this.totalAmountToSend);
    }

    updateRemainingBalance() {
        let remainingBalanceBig;
        if (this.changeOutput !== null) {
            remainingBalanceBig = this.changeOutput.amount.minus(this.transactionFeeBig);
        } else {
            remainingBalanceBig = new Big(0).minus(this.transactionFeeBig);
        }
        this.remainingBalance = parseFloat(remainingBalanceBig.valueOf()).toFixed(8);
        this.remainingBalance = this.sendService.removeTailingZeros(this.remainingBalance);
    }

    clear() {
        this.from = null;
        this.selectedDestination = null;
        this.selectedAmount = null;
        this.changeOutput = null;
        this.outputArray = new Array<Output>();
        this.utxoArray = new Array<Transaction>();
        this.transactionHex = null;
        this.balanceBig = null;
        this.balance = null;

        this.transactionFeeBig = null;
        this.transactionFee = null;
        this.totalAmountToSend = null;
        this.remainingBalance = null;

        this.wif = null;

        this.transaction = null;

        this.wifMatchAddress = null;
    }

    //TODO rename
    canSend() {
        return this.utxoArray.length > 0;
    }

    satoshiPerByteChanged() {
        for (let fee of this.feeArray) {
            if (fee.minFee <= this.satoshiPerByte && fee.maxFee >= this.satoshiPerByte) {
                this.minimumEstimatedConfirmationTimeInMinute = fee.minMinutes;
                this.maximumEstimatedConfirmationTimeInMinute = fee.maxMinutes;
                break;
            }
        }
        this.updateTransactionFee();
        this.updateRemainingBalance();
    }

    isRemainingBalanceNegative() {
        return parseFloat(this.remainingBalance) <= 0;
    }

    isFromValid() {
        return this.from !== undefined && this.from !== null &&
            this.sendService.isValidAddress(this.from.toString(), this.environment.network);
    }

    checkWifMatchAddress() {
        this.wifMatchAddress = this.walletGenerationService.isWifMatchAddress(this.wif, this.from.toString());
    }

    send() {
        let changeOutputMinusFees = new Output(this.changeOutput.destination, this.changeOutput.amount.minus(this.transactionFeeBig));
        this.transaction = this.sendService.createTransaction(this.outputArray, changeOutputMinusFees, this.utxoArray,
            this.from, this.wif);
        this.transactionHex = this.transaction.toHex();
        this.sendService.broadcast(this.transactionHex).subscribe(data => {
            let responseList = new Array<JsonRpcResponse>();
            for (let responseString of data) {
                let response = JsonRpcResponse.from(responseString);
                if (response.error) {
                    M.toast({html: 'Sending error ! Tx: ' + response.error.message});
                    console.error(response.error);
                    return;
                }
                responseList.push(response);
            }
            let response = responseList[1];
            M.toast({html: 'Sending complete ! Tx:' + response.result});
            this.clear();
        }, (error: HttpErrorResponse) => {
            M.toast({html: 'Error while connecting to the proxy server! please try again later'});
            console.error(error);
        });
    }

}
