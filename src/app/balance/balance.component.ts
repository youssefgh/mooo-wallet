import { AfterContentChecked, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Big } from 'big.js';
import { environment } from '../../environments/environment';
import { ConversionService } from '../conversion.service';
import { Bip21DecoderUtils } from '../core/bip21-decoder-utils';
import { Address } from '../core/bitcoinjs/address';
import { Bip32Utils } from '../core/bitcoinjs/bip32.utils';
import { ConfirmedTransaction } from '../core/bitcoinjs/confirmed-transaction';
import { HdCoin } from '../core/bitcoinjs/hd-coin';
import { Network } from '../core/bitcoinjs/network';
import { GetBalanceResponse } from '../core/electrum/get-balance-response';
import { GetHistoryResponseItem } from '../core/electrum/get-history-response-item';
import { OutputDescriptor } from '../core/output-descriptor';
import { OutputDescriptorKey } from '../core/output-descriptor-key';
import { QrCodeReaderComponent } from '../qr-code-reader/qr-code-reader.component';
import { LocalStorageService } from '../shared/local-storage.service';
import { BalanceService } from './balance.service';

declare const M: any;

@Component({
    selector: 'app-balance',
    templateUrl: './balance.component.html',
    styleUrls: ['./balance.component.css']
})
export class BalanceComponent implements OnInit, AfterContentChecked {

    environment = environment;
    qrCodeReaderComponent: QrCodeReaderComponent;
    source: string;
    confirmedBalance: string;
    unconfirmedBalance: string;
    transactionArray: ConfirmedTransaction[];

    constructor(private balanceService: BalanceService,
        private conversionService: ConversionService,
        private localStorageService: LocalStorageService,
        private route: ActivatedRoute,
        private router: Router,
    ) { }

    ngOnInit() {
        if (this.route.snapshot.queryParamMap.get('source') !== null) {
            this.source = this.descriptorFrom(this.route.snapshot.queryParamMap.get('source'));
            this.loadBalance();
        }
    }

    descriptorFrom(source: string) {
        if (source.substring(1, 4) === 'pub') {
            const extendedkeyDetails = Bip32Utils.extendedkeyDetailsFromBase58Sip(source, environment.network);
            const hdCoin = HdCoin.id(environment.network)
            const outputDescriptorKey = new OutputDescriptorKey();
            outputDescriptorKey.fingerprint = 'FFFFFFFF';
            outputDescriptorKey.derivation = `/${extendedkeyDetails.purpose}'/${hdCoin}'/0'`;
            outputDescriptorKey.value = extendedkeyDetails.extendedkey;
            const outputDescriptor = new OutputDescriptor();
            outputDescriptor.script = OutputDescriptor.scriptFromPurpose(extendedkeyDetails.purpose);
            outputDescriptor.key = outputDescriptorKey;
            M.toast({
                html: 'SIP exended key adapted to output descriptor !',
                classes: 'orange', displayLength: 10000
            });
            return outputDescriptor.toString();
        }
        return source;
    }

    ngAfterContentChecked() {
        M.updateTextFields();
        const elements = document.getElementsByClassName('materialize-textarea');
        for (const element of elements) {
            M.textareaAutoResize(element);
        }
    }

    onQrReaderCreated(qrCodeReaderComponent: QrCodeReaderComponent) {
        this.qrCodeReaderComponent = qrCodeReaderComponent;
    }

    onQrScan(text: string) {
        if (Bip21DecoderUtils.isBip21(text)) {
            const bip21 = Bip21DecoderUtils.decode(text);
            this.source = bip21.address;
        } else {
            this.source = text;
        }
        this.qrCodeReaderComponent.stopDecodeFromVideoDevice();
    }

    loadBalance() {
        if (!this.source.includes('(')) {
            this.loadBalanceFromAddress(this.source);
        } else {
            this.loadBalanceFromDescriptor();
        }
    }

    async loadBalanceFromAddress(address: string) {
        if (address == null || !Address.isValid(address, environment.network)) {
            M.toast({ html: 'Incorrect address !', classes: 'red' });
        } else {
            const addressList = new Array<Address>();
            addressList.push(new Address(address));

            const partialResponseList = await this.balanceService.loadBalanceFrom(addressList, environment.electrumProtocol,
                environment.proxyAddress, Network.from(environment.network));
            partialResponseList.splice(0, 1);
            const partialGetBalanceResponseList = partialResponseList.map(response => {
                return response.toGetBalanceResponse();
            });
            const getBalanceResponse = partialGetBalanceResponseList[0];

            this.confirmedBalance = this.conversionService.bigSatoshiToBitcoinBig(getBalanceResponse.confirmed).valueOf();
            this.unconfirmedBalance = this.conversionService.bigSatoshiToBitcoinBig(getBalanceResponse.unconfirmed).valueOf();
        }
    }

    // todo use shared logic with load history
    async loadBalanceFromDescriptor() {
        const outputDescriptor = OutputDescriptor.from(this.source);
        let addressList: Array<Address>;
        let fromIndex = 0;
        let change = 0;

        let found;
        let getBalanceResponseList = new Array<GetBalanceResponse>();
        try {
            do {
                found = false;
                let derivedArray = outputDescriptor.derive(change, fromIndex, fromIndex + this.localStorageService.settings.gapLimit, environment.network);
                addressList = derivedArray
                    .map(derived => {
                        return derived.address;
                    });
                const partialResponseList = await this.balanceService.loadBalanceFrom(addressList, environment.electrumProtocol,
                    environment.proxyAddress, Network.from(environment.network));
                partialResponseList.splice(0, 1);
                const partialGetBalanceResponseList = partialResponseList.map(response => {
                    return response.toGetBalanceResponse();
                });
                for (const getBalanceResponse of partialGetBalanceResponseList) {
                    if (getBalanceResponse.confirmed.gt(new Big(0)) || getBalanceResponse.unconfirmed.gt(new Big(0))) {
                        found = true;
                        break;
                    }
                }
                getBalanceResponseList = getBalanceResponseList.concat(partialGetBalanceResponseList);
                fromIndex = fromIndex + this.localStorageService.settings.gapLimit;

                if (!found && change === 0) {
                    change = 1;
                    fromIndex = 0;
                }
            } while (found || fromIndex === 0);

            let confirmedBalance = new Big(0);
            let unconfirmedBalance = new Big(0);
            for (const getBalanceResponse of getBalanceResponseList) {
                confirmedBalance = confirmedBalance.plus(getBalanceResponse.confirmed);
                unconfirmedBalance = unconfirmedBalance.plus(getBalanceResponse.unconfirmed);
            }
            this.confirmedBalance = this.conversionService.bigSatoshiToBitcoinBig(confirmedBalance).valueOf();
            this.unconfirmedBalance = this.conversionService.bigSatoshiToBitcoinBig(unconfirmedBalance).valueOf();
        } catch (error) {
            M.toast({ html: 'Error while getting the balance ! ' + error.message, classes: 'red' });
            console.error(error);
        }
    }

    reloadBalance() {
        this.confirmedBalance = null;
        this.unconfirmedBalance = null;
        this.transactionArray = null;
        this.loadBalance();
    }

    loadHistory() {
        if (!this.source.includes('(')) {
            this.loadHistoryFromAddress(this.source);
        } else {
            this.loadHistoryFromDescriptor();
        }
    }

    async loadHistoryFromAddress(address: string) {
        const addressList = new Array<Address>();
        addressList.push(new Address(address));

        const partialResponseList = await this.balanceService.loadHistoryFrom(addressList, environment.electrumProtocol,
            environment.proxyAddress, Network.from(environment.network));
        partialResponseList.splice(0, 1);
        const headersResponse = partialResponseList[0].toHeadersResponse();
        partialResponseList.splice(0, 1);
        const partialGetHistoryResponseList = partialResponseList.map(response => {
            return response.toGetHistoryResponse().filter(item => item.transactionHash);
        });
        const getHistoryResponse = partialGetHistoryResponseList[0];
        this.transactionArray = getHistoryResponse
            .map(getHistoryResponseItem => this.confirmedTransactionOf(getHistoryResponseItem, headersResponse.height))
            .sort((a, b) => a.confirmations > b.confirmations ? 1 : -1);
    }

    async loadHistoryFromDescriptor() {
        const outputDescriptor = OutputDescriptor.from(this.source);
        let addressList: Array<Address>;
        let fromIndex = 0;
        let change = 0;

        let found;
        let getHistoryResponseItemList = new Array<GetHistoryResponseItem>();
        let headersResponse;
        try {
            do {
                found = false;
                addressList = outputDescriptor.derive(change, fromIndex, fromIndex + this.localStorageService.settings.gapLimit, environment.network)
                    .map(derived => {
                        return derived.address;
                    });
                const partialResponseList = await this.balanceService.loadHistoryFrom(addressList, environment.electrumProtocol,
                    environment.proxyAddress, Network.from(environment.network));
                partialResponseList.splice(0, 1);
                headersResponse = partialResponseList[0].toHeadersResponse();
                partialResponseList.splice(0, 1);
                const partialGetHistoryResponseList = partialResponseList.map(response => {
                    return response.toGetHistoryResponse().filter(item => item.transactionHash);
                });
                for (const getHistoryResponse of partialGetHistoryResponseList) {
                    for (const getHistoryResponseItem of getHistoryResponse) {
                        if (getHistoryResponseItem.transactionHash) {
                            found = true;
                            break;
                        }
                    }
                    getHistoryResponseItemList = getHistoryResponseItemList.concat(getHistoryResponse);
                }

                fromIndex = fromIndex + this.localStorageService.settings.gapLimit;

                if (!found && change === 0) {
                    change = 1;
                    fromIndex = 0;
                }
            } while (found || fromIndex === 0);

            this.transactionArray = getHistoryResponseItemList
                .map(getHistoryResponseItem => this.confirmedTransactionOf(getHistoryResponseItem, headersResponse.height))
                .sort((a, b) => a.confirmations > b.confirmations ? 1 : -1)
                .filter((value, index, self) => {
                    if (index !== 0) {
                        return self[index - 1].id !== value.id;
                    }
                    return true;
                });
        } catch (error) {
            M.toast({ html: 'Error while getting the balance ! ' + error.message, classes: 'red' });
            console.error(error);
        }
    }

    confirmedTransactionOf(getHistoryResponseItem: GetHistoryResponseItem, height: number) {
        const confirmedTransaction = new ConfirmedTransaction();
        confirmedTransaction.id = getHistoryResponseItem.transactionHash;
        confirmedTransaction.height = getHistoryResponseItem.height;
        if (confirmedTransaction.height) {
            confirmedTransaction.confirmations = height - confirmedTransaction.height + 1;
        } else {
            confirmedTransaction.confirmations = 0;
        }
        return confirmedTransaction;
    }

    clear() {
        this.source = null;
        this.confirmedBalance = null;
        this.unconfirmedBalance = null;
        this.transactionArray = null;
        this.router.navigate([], { relativeTo: this.route });
    }

}
