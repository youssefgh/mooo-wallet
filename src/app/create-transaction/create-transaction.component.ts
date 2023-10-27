import { HttpErrorResponse } from '@angular/common/http';
import { AfterContentChecked, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Big } from 'big.js';
import * as coinSelect from 'bitcoinselect/split';
import { environment } from '../../environments/environment';
import { ConversionService } from '../conversion.service';
import { Bip21DecoderUtils } from '../core/bip21-decoder-utils';
import { Derived } from '../core/bitcoinjs/derived';
import { Network } from '../core/bitcoinjs/network';
import { Output } from '../core/bitcoinjs/output';
import { Psbt } from '../core/bitcoinjs/psbt';
import { PsbtFactory } from '../core/bitcoinjs/psbt-factory';
import { Utxo } from '../core/bitcoinjs/utxo';
import { OutputDescriptor } from '../core/output-descriptor';
import { UrEncoderUtils } from '../core/ur-encoder-utils';
import { QrCodeReaderComponent } from '../qr-code-reader/qr-code-reader.component';
import { LocalStorageService } from '../shared/local-storage.service';
import { CreateTransactionService } from './create-transaction.service';

declare const M: any;

@Component({
    selector: 'app-create-transaction',
    templateUrl: './create-transaction.component.html',
    styleUrls: ['./create-transaction.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class CreateTransactionComponent implements OnInit, AfterContentChecked {

    sourceQrCodeReaderComponent: QrCodeReaderComponent;
    destinationQrCodeReaderComponent: QrCodeReaderComponent;
    descriptor: string;
    selectedDestination: string;
    selectedAmount: number;
    changeOutput: Output;
    outputArray = new Array<Output>();
    utxoArray = new Array<Utxo>();
    minimumRelayFeeInBtc: number;
    psbt: Psbt;
    base64: string;
    balance: Big;
    transactionFee: Big;
    totalAmountToSend: Big;

    minSelectableFee: number = 1;
    maxSelectableFee: number;
    satoshiPerByte: number;

    environment = environment;

    selectedQrList: string[];
    qrModal;

    @ViewChild('qrModal', { static: true })
    qrModalRef: ElementRef;

    constructor(
        private conversionService: ConversionService,
        private localStorageService: LocalStorageService,
        private service: CreateTransactionService,
        private router: Router,
    ) { }

    ngOnInit() {
        const elem = this.qrModalRef.nativeElement;
        this.qrModal = M.Modal.init(elem, {});
    }

    ngAfterContentChecked() {
        M.updateTextFields();
        const elements = document.getElementsByClassName('materialize-textarea');
        for (const element of elements) {
            M.textareaAutoResize(element);
        }
    }

    onSourceQrReaderCreated(qrCodeReaderComponent: QrCodeReaderComponent) {
        this.sourceQrCodeReaderComponent = qrCodeReaderComponent;
    }

    onSourceQrScan(text: string) {
        this.descriptor = text;
        this.sourceQrCodeReaderComponent.stopDecodeFromVideoDevice();
    }

    isOutputDescriptorValid(outputDescriptor: OutputDescriptor) {
        const account = 0;
        const change = 0;
        try {
            outputDescriptor.derive(change, account, 1, environment.network);
            return true;
        } catch (e) {
            return false;
        }
    }

    async loadUTXO() {
        const outputDescriptor = OutputDescriptor.from(this.descriptor);
        if (this.isOutputDescriptorValid(outputDescriptor)) {
            await this.loadUTXOFromOutputDescriptor(outputDescriptor);
        } else {
            M.toast({ html: 'Invalid or incompatible output descriptor', classes: 'red' });
        }
    }

    async loadUTXOFromList(derivedList: Array<Derived>) {
        try {
            const response = await this.service.loadUTXO(derivedList, environment.electrumProtocol,
                environment.proxyAddress, Network.from(environment.network));
            this.minimumRelayFeeInBtc = response.minimumRelayFeeInBtc;
            if (!this.satoshiPerByte) {
                this.satoshiPerByte = new Big(ConversionService.satoshiInBitcoin).mul(response.estimatefeeInBtc).toNumber();
                this.maxSelectableFee = this.satoshiPerByte + 10;
            }
            this.utxoArray = response.utxoArray;
            if (this.utxoArray.length === 0) {
                M.toast({ html: 'This wallet doesn\'t have confirmed balance', classes: 'red' });
                return;
            }
            this.updateBalance();
        } catch (error) {
            M.toast({ html: 'Error while connecting to the proxy server! please try again later', classes: 'red' });
            M.toast({ html: 'Can\'t list unspent ! Error : ' + (error as HttpErrorResponse).message, classes: 'red' });
            console.error(error);
        }
    }

    async loadUTXOFromOutputDescriptor(outputDescriptor: OutputDescriptor) {
        const gap = this.localStorageService.settings.gapLimit;
        let lastUsedChangeIndex = -1;
        const usedDerivedList = new Array<Derived>();
        try {
            for (const change of [0, 1]) {
                let fromIndex = -gap;
                let toIndex = 0;
                let lastUsedIndex = -1;
                do {
                    fromIndex += gap;
                    toIndex += gap;
                    let derivedList = outputDescriptor.derive(change, fromIndex, fromIndex + gap, environment.network);
                    const historyArray =
                        await this.service.loadHistoryFrom(derivedList, environment.electrumProtocol,
                            environment.proxyAddress, Network.from(environment.network));
                    for (let i = 0; i < historyArray.length; i++) {
                        const history = historyArray[i];
                        if (history.length > 0) {
                            usedDerivedList.push(derivedList[i]);
                            lastUsedIndex = fromIndex + i;
                            if (change === 1) {
                                lastUsedChangeIndex = lastUsedIndex;
                            }
                        }
                    }
                } while (fromIndex <= lastUsedIndex && lastUsedIndex < toIndex);
            }
            const changeDerived = outputDescriptor.derive(1, lastUsedChangeIndex + 1, lastUsedChangeIndex + 2, environment.network)[0];
            this.changeOutput = new Output(changeDerived.address.value, undefined, changeDerived);
            await this.loadUTXOFromList(usedDerivedList);
        } catch (error) {
            M.toast({ html: 'Error while getting the balance ! ' + (error as HttpErrorResponse).message, classes: 'red' });
            console.error(error);
        }
    }

    coinSelect(outputArray: Array<Output>) {
        return coinSelect(
            this.utxoArray.map((u) => {
                return { txId: u.transaction.id, vout: u.vout, value: u.satoshis };
            }),
            outputArray.map((o) => {
                return { address: o.destination, value: o.amount };
            })
            , this.satoshiPerByte);
    }

    removeUTXO(index: number) {
        this.utxoArray.splice(index, 1);
        this.updateBalance();
    }

    satoshiPerByteChanged() {
        const outputArray = [...this.outputArray];
        outputArray.push(new Output(this.changeOutput.destination, undefined));

        const { outputs, fee } = this.coinSelect(outputArray);
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

    onDestinationQrReaderCreated(qrCodeReaderComponent: QrCodeReaderComponent) {
        this.destinationQrCodeReaderComponent = qrCodeReaderComponent;
    }

    onDestinationQrScan(text: string) {
        if (Bip21DecoderUtils.isBip21(text)) {
            const bip21 = Bip21DecoderUtils.decode(text);
            this.selectedDestination = bip21.address;
            this.selectedAmount = bip21.amount;
        } else {
            this.selectedDestination = text;
        }
        this.destinationQrCodeReaderComponent.stopDecodeFromVideoDevice();
    }

    addDestination() {
        let selectedAmount: number;
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

        const { outputs, fee } = this.coinSelect(outputArray);
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

        const { outputs, fee } = this.coinSelect(outputArray);
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
        this.balance = this.service.calculateBalance(this.utxoArray);
    }

    updateTotalAmountToSend() {
        let totalAmountToSend = new Big(0);
        for (const output of this.outputArray) {
            totalAmountToSend = totalAmountToSend.plus(output.amount);
        }
        this.totalAmountToSend = totalAmountToSend;
    }

    utxosAvailable() {
        return this.utxoArray.length > 0;
    }

    isRemainingBalanceNegative() {
        return this.changeOutput.amount < 0;
    }

    createPsbt() {
        const outputDescriptor = OutputDescriptor.from(this.descriptor);
        this.psbt = PsbtFactory.create(outputDescriptor, this.outputArray, this.changeOutput, this.utxoArray, environment.network);
        this.base64 = this.psbt.object.toBase64();
    }

    showQr(base64: string) {
        if (base64.length < 1000) {
            this.selectedQrList = [base64];
        } else {
            this.selectedQrList = UrEncoderUtils.encodePsbt(base64);
        }
        this.qrModal.open();
    }

    signPsbt() {
        this.router.navigate(['./sign'], { state: { data: this.base64 } });
    }

    clear() {
        this.descriptor = undefined;
        this.selectedDestination = undefined;
        this.selectedAmount = undefined;
        this.changeOutput = undefined;
        this.outputArray = new Array<Output>();
        this.utxoArray = new Array<Utxo>();
        this.psbt = undefined;
        this.balance = undefined;

        this.transactionFee = undefined;
        this.totalAmountToSend = undefined;
    }

}
