import { HttpErrorResponse } from '@angular/common/http';
import { AfterContentChecked, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Big } from 'big.js';
import { networks } from 'bitcoinjs-lib';
import * as coinSelect from 'coinselect/split';
import { environment } from '../../environments/environment';
import { ConversionService } from '../conversion.service';
import { Derivator } from '../core/bitcoinjs/derivator';
import { Mnemonic } from '../core/bitcoinjs/mnemonic';
import { Network } from '../core/bitcoinjs/network';
import { Psbt } from '../core/bitcoinjs/psbt';
import { Derived } from '../core/derived';
import { JsonRpcResponse } from '../core/electrum/json-rpc-response';
import { WsTransaction } from '../core/electrum/wsTransaction';
import { Output } from '../core/output';
import { LocalStorageService } from '../shared/local-storage.service';
import { SendService } from './send.service';

declare const M: any;

@Component({
    selector: 'app-send',
    templateUrl: './send.component.html',
    styleUrls: ['./send.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class SendComponent implements OnInit, AfterContentChecked {

    advancedMode = true;

    from: string;
    isLegacyAccount = false;
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

    minSelectableFee: number = 1;
    maxSelectableFee: number;
    satoshiPerByte: number;

    environment = environment;

    // TODO move to settings
    gap = 20;

    selectedQr: string;
    qrModal;

    @ViewChild('qrModal', { static: true })
    qrModalRef: ElementRef;

    constructor(
        private conversionService: ConversionService,
        private localStorageService: LocalStorageService,
        private sendService: SendService
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

    onSourceQrScan(text: string) {
        this.from = text;
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

    isPossibleLegacyAccount() {
        return this.localStorageService.settings.bip44Enabled &&
            this.from && (
                (environment.network === networks.bitcoin && this.from.startsWith('xpub'))
                || (environment.network === networks.testnet && this.from.startsWith('tpub'))
                || (environment.network === networks.regtest && this.from.startsWith('tpub'))
            );
    }

    loadUTXO() {
        if (this.isFromValid()) {
            this.loadUTXOFromKey(this.from);
        }
    }

    async loadUTXOFromList(derivedList: Array<Derived>) {
        try {
            const response = await this.sendService.loadUTXO(derivedList, environment.electrumProtocol,
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

    async loadUTXOFromKey(key: string) {
        const gap = this.gap;
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
                    let derivedList: Array<Derived>;
                    if (this.isLegacyAccount && this.isPossibleLegacyAccount()) {
                        derivedList = Derivator.deriveWithPurpose(key, 44, change, fromIndex, fromIndex + this.gap, environment.network);
                    } else {
                        derivedList = Derivator.derive(key, change, fromIndex, fromIndex + this.gap, environment.network);
                    }
                    const historyArray =
                        await this.sendService.loadHistoryFrom(derivedList, environment.electrumProtocol,
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
            const changeAddress = Derivator.derive(key, 1, lastUsedChangeIndex + 1, lastUsedChangeIndex + 2, environment.network)
            [0].address;
            this.changeOutput = new Output(changeAddress.value, undefined);
            this.loadUTXOFromList(usedDerivedList);
        } catch (error) {
            M.toast({ html: 'Error while getting the balance ! ' + (error as HttpErrorResponse).message, classes: 'red' });
            console.error(error);
        }
    }

    coinSelect(outputArray: Array<Output>) {
        return coinSelect(
            this.utxoArray.map((u) => {
                return { txId: u.id, vout: u.vout, value: u.satoshis };
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

    onDestinationQrScan(text: string) {
        this.selectedDestination = text;
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
        this.balance = this.sendService.calculateBalance(this.utxoArray);
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

    async broadcast() {
        try {
            const data = await this.sendService.broadcast(this.psbt.signedTransaction,
                environment.electrumProtocol, environment.proxyAddress);
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
        } catch (error) {
            M.toast({ html: 'Error while connecting to the proxy server! please try again later', classes: 'red' });
            console.error(error);
        }
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
