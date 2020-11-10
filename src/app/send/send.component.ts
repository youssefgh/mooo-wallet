import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { AfterContentChecked, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Big } from 'big.js';
import * as coinSelect from 'coinselect/split';
import { EMPTY, Observable } from 'rxjs';
import { expand } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BalanceService } from '../balance/balance.service';
import { ConversionService } from '../conversion.service';
import { Fee } from '../core/bitcoinfees/fee';
import { FeeResponse } from '../core/bitcoinfees/fee-response';
import { Derivator } from '../core/bitcoinjs/derivator';
import { Mnemonic } from '../core/bitcoinjs/mnemonic';
import { Network } from '../core/bitcoinjs/network';
import { Psbt } from '../core/bitcoinjs/psbt';
import { Derived } from '../core/derived';
import { JsonRpcResponse } from '../core/electrum/json-rpc-response';
import { WsTransaction } from '../core/electrum/wsTransaction';
import { Output } from '../core/output';
import { SendService } from './send.service';

declare var M: any;

@Component({
    selector: 'app-send',
    templateUrl: './send.component.html',
    styleUrls: ['./send.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class SendComponent implements OnInit, AfterContentChecked {

    advancedMode = true;

    from: string;
    selectedDestination: string;
    selectedAmount: number;
    changeOutput: Output;
    outputArray = new Array<Output>();
    utxoArray = new Array<WsTransaction>();
    minimumRelayFeeInBtc: number;
    psbt: Psbt;
    // transactionHex: string;
    balance: Big;
    transactionFee: Big;
    totalAmountToSend: Big;

    mnemonic = new Mnemonic;

    minSelectableFee: number;
    maxSelectableFee: number;
    satoshiPerByte: number;
    minimumEstimatedConfirmationTimeInMinute: number;
    maximumEstimatedConfirmationTimeInMinute: number;
    feeArray: Fee[];

    environment = environment;

    // TODO move to settings
    gap = 20;

    selectedQr: string;
    qrModal;

    @ViewChild('qrModal', { static: true })
    qrModalRef: ElementRef;

    constructor(private balanceService: BalanceService,
        private conversionService: ConversionService,
        private httpClient: HttpClient,
        private sendService: SendService
    ) { }

    ngOnInit() {
        this.loadFeeArray();

        const elem = this.qrModalRef.nativeElement;
        this.qrModal = M.Modal.init(elem, {});
    }

    ngAfterContentChecked() {
        M.updateTextFields();
        const elements = document.getElementsByClassName('materialize-textarea');
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            M.textareaAutoResize(element);
        }
    }

    onSourceQrScan(text: string) {
        this.from = text;
    }

    loadFeeArray() {
        this.httpClient.get<FeeResponse>(environment.bitcoinfeesAddress,
            { headers: new HttpHeaders() })
            .subscribe(feeResponse => {
                this.feeArray = feeResponse.fees;
                this.minSelectableFee = 1;
                this.maxSelectableFee = 500;
                const defaultFee = this.sendService.feeForEstimatedConfirmationTime(60, this.feeArray);
                this.satoshiPerByte = defaultFee.minFee;
                if (this.satoshiPerByte > this.maxSelectableFee) {
                    this.maxSelectableFee = this.satoshiPerByte;
                }
                this.minimumEstimatedConfirmationTimeInMinute = defaultFee.minMinutes;
                this.maximumEstimatedConfirmationTimeInMinute = defaultFee.maxMinutes;
            }, (error: HttpErrorResponse) => {
                M.toast({ html: 'Error while connecting to the proxy server! please try again later', classes: 'red' });
                console.error(error);
            });
    }

    isFromValid() {
        const account = 0;
        const change = 0;
        try {
            Derivator.derive(this.from, change, account, 1, environment.network);
            return true;
        } catch (e) {
            return false;
        }
    }

    loadUTXO() {
        if (this.isFromValid()) {
            this.loadUTXOFromKey(this.from);
        }
    }

    loadUTXOFromList(derivedList: Array<Derived>) {
        this.sendService.loadUTXO(derivedList, environment.electrumServer, environment.electrumPort, environment.electrumProtocol,
            environment.proxyAddress, Network.from(environment.network)).subscribe(data => {
                this.sendService.rawTransactionListFrom(data.utxoArray, environment.electrumServer, environment.electrumPort,
                    environment.electrumProtocol, environment.proxyAddress).subscribe(rawTransactionArray => {
                        let i = 0;
                        data.utxoArray.forEach(transaction => {
                            transaction.transactionHex = rawTransactionArray[i];
                            i++;
                        });
                        this.minimumRelayFeeInBtc = data.minimumRelayFeeInBtc;
                        this.utxoArray = data.utxoArray;
                        if (this.utxoArray.length === 0) {
                            M.toast({ html: 'This wallet doesn\'t have confirmed balance', classes: 'red' });
                            return;
                        }
                        this.updateBalance();
                    }, (error: HttpErrorResponse) => {
                        M.toast({ html: 'Error while connecting to the proxy server! please try again later', classes: 'red' });
                        M.toast({ html: 'Can\'t list unspent ! Error : ' + error.message, classes: 'red' });
                        console.error(error);
                    });
            });
    }

    loadUTXOFromKey(key) {
        let fromIndex = 0;
        const gap = this.gap;
        let toIndex = gap;
        let change = 0;
        let repeat;
        let derivedList = Derivator.derive(key, change, fromIndex, toIndex, environment.network);
        let lastUsedIndex = -1;
        const usedDerivedList = new Array;
        this.balanceService.loadHistoryFrom(derivedList, environment.electrumServer, environment.electrumPort, environment.electrumProtocol,
            environment.proxyAddress, Network.from(environment.network)).pipe(expand((transactionArrayArray) => {
                if (!repeat) {
                    if (toIndex - lastUsedIndex >= gap) {
                        if (change === 0) {
                            change = 1;
                            fromIndex = 0;
                            toIndex = gap;
                            lastUsedIndex = -1;
                            // TODO check change gap
                            // gap = 1
                        } else {
                            const changeAddress = Derivator.derive(key, change, lastUsedIndex + 1, lastUsedIndex + 2, environment.network)
                            [0].address;
                            this.changeOutput = new Output(changeAddress.value, undefined);
                            this.loadUTXOFromList(usedDerivedList);
                            return EMPTY;
                        }
                    }
                }
                if (change !== 1 || lastUsedIndex !== -1) {
                    fromIndex = toIndex;
                    toIndex = lastUsedIndex + gap;
                }
                derivedList = Derivator.derive(key, change, fromIndex, toIndex, environment.network);
                return this.balanceService.loadHistoryFrom(derivedList, environment.electrumServer,
                    environment.electrumPort, environment.electrumProtocol,
                    environment.proxyAddress, Network.from(environment.network));
            })).subscribe(transactionArrayArray => {
                repeat = false;
                if (!(transactionArrayArray instanceof Observable)) {
                    for (let index = 0; index < transactionArrayArray.length; index++) {
                        const transactionArray = transactionArrayArray[index];
                        if (transactionArray.length !== 0) {
                            usedDerivedList.push(derivedList[index]);
                            lastUsedIndex = fromIndex + index;
                            repeat = true;
                        }
                    }
                }
            }, (error: HttpErrorResponse) => {
                M.toast({ html: 'Error while getting the balance ! ' + error.message, classes: 'red' });
                console.error(error);
            });
    }

    removeUTXO(index: number) {
        this.utxoArray.splice(index, 1);
        this.updateBalance();
    }

    satoshiPerByteChanged() {
        for (const feeItem of this.feeArray) {
            if (feeItem.minFee <= this.satoshiPerByte && feeItem.maxFee >= this.satoshiPerByte) {
                this.minimumEstimatedConfirmationTimeInMinute = feeItem.minMinutes;
                this.maximumEstimatedConfirmationTimeInMinute = feeItem.maxMinutes;
                break;
            }
        }
        // TODO remove dup
        const outputArray = [...this.outputArray];
        outputArray.push(new Output(this.changeOutput.destination, undefined));

        const { inputs, outputs, fee } = coinSelect(
            this.utxoArray.map((u) => {
                return { txId: u.id, vout: u.vout, value: u.satoshis };
            }),
            outputArray.map((o) => {
                return { address: o.destination, value: o.amount };
            })
            , this.satoshiPerByte);
        if (!outputs) {
            M.toast({ html: 'Insufficient balance ! reduce the  transaction fee', classes: 'red' });
            this.transactionFee = new Big(fee);
        } else {
            for (const output of outputs) {
                if (output.address === this.changeOutput.destination) {
                    this.changeOutput.amount = output.value;
                    break;
                }
            }
            this.transactionFee = new Big(fee);
        }
    }

    onDestinationQrScan(text: string) {
        this.selectedDestination = text;
    }

    addDestination() {
        let selectedAmount;
        try {
            selectedAmount = this.conversionService.bitcoinToSatoshi(this.selectedAmount);
            if (selectedAmount < 0) {
                throw new RangeError();
            }
            const usableBalance = this.changeOutput.amount ? this.changeOutput.amount : this.conversionService.bigToNumber(this.balance);
            if (selectedAmount >= usableBalance) {
                throw new RangeError();
            }
        } catch (e) {
            M.toast({ html: 'Incorrect amount !', classes: 'red' });
            return;
        }

        const outputArray = [...this.outputArray];
        const outputToAdd = new Output(this.selectedDestination, selectedAmount);
        outputArray.push(outputToAdd);
        outputArray.push(new Output(this.changeOutput.destination, undefined));

        const { inputs, outputs, fee } = coinSelect(
            this.utxoArray.map((u) => {
                return { txId: u.id, vout: u.vout, value: u.satoshis };
            }),
            outputArray.map((o) => {
                return { address: o.destination, value: o.amount };
            })
            , this.satoshiPerByte);
        if (!outputs) {
            M.toast({ html: 'The amount is too big ! reduce the amount to pay transaction fee', classes: 'red' });
            return;
        }

        for (const output of outputs) {
            if (output.address === this.changeOutput.destination) {
                this.changeOutput.amount = output.value;
                break;
            }
        }
        this.transactionFee = new Big(fee);
        this.outputArray.push(outputToAdd);
        this.updateTotalAmountToSend();
        this.selectedDestination = undefined;
        this.selectedAmount = undefined;
    }

    removeDestination(index: number) {
        this.outputArray.splice(index, 1);
        const outputArray = [...this.outputArray];
        outputArray.push(new Output(this.changeOutput.destination, undefined));

        const { inputs, outputs, fee } = coinSelect(
            this.utxoArray.map((u) => {
                return { txId: u.id, vout: u.vout, value: u.satoshis };
            }),
            outputArray.map((o) => {
                return { address: o.destination, value: o.amount };
            })
            , this.satoshiPerByte);
        if (outputs) {
            for (const output of outputs) {
                if (output.address === this.changeOutput.destination) {
                    this.changeOutput.amount = output.value;
                    break;
                }
            }
        }
        this.transactionFee = new Big(fee);
        this.updateTotalAmountToSend();
    }

    updateBalance() {
        this.balance = this.sendService.calculateBalance(this.utxoArray);
    }

    updateTotalAmountToSend() {
        let totalAmountToSend = new Big(0);
        for (const output of this.outputArray) {
            totalAmountToSend = totalAmountToSend.plus(output.amount);
        }
        this.totalAmountToSend = totalAmountToSend;
    }

    // TODO rename
    canSend() {
        return this.utxoArray.length > 0;
    }

    isRemainingBalanceNegative() {
        return this.changeOutput.amount < 0;
    }

    createPsbt() {
        this.psbt = Psbt.from(this.outputArray, this.changeOutput, this.utxoArray, environment.network);
    }

    showQr(qr: string) {
        this.selectedQr = qr;
        this.qrModal.open();
    }

    signPsbt() {
        if (!this.mnemonic.matchsKey(this.from, this.environment.network)) {
            M.toast({ html: 'Signing error ! Mnemonic and/or passphrase doesn\'t match extended key', classes: 'red' });
            return;
        }
        this.psbt.sign(this.mnemonic);
    }

    broadcast() {
        this.sendService.broadcast(this.psbt.signedTransaction, environment.electrumServer, environment.electrumPort,
            environment.electrumProtocol, environment.proxyAddress).subscribe(data => {
                let responseList = new Array<JsonRpcResponse>();
                for (const responseString of data) {
                    const responseObject = JsonRpcResponse.from(responseString);
                    if (responseObject.error) {
                        M.toast({ html: 'Sending error ! Tx: ' + responseObject.error.message, classes: 'red' });
                        console.error(responseObject.error);
                        return;
                    }
                    responseList.push(responseObject);
                }
                responseList = responseList.sort((a, b) => a.id > b.id ? 1 : -1);
                const response = responseList[1];
                M.toast({ html: 'Sending complete ! Tx:' + response.result, classes: 'green' });
                this.clear();
            }, (error: HttpErrorResponse) => {
                M.toast({ html: 'Error while connecting to the proxy server! please try again later', classes: 'red' });
                console.error(error);
            });
    }

    clear() {
        this.from = undefined;
        this.selectedDestination = undefined;
        this.selectedAmount = undefined;
        this.changeOutput = undefined;
        this.outputArray = new Array<Output>();
        this.utxoArray = new Array<WsTransaction>();
        this.psbt = undefined;
        this.balance = undefined;

        this.transactionFee = undefined;
        this.totalAmountToSend = undefined;

        this.mnemonic = new Mnemonic;
    }

}
