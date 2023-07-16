import { AfterContentChecked, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Big } from 'big.js';
import { networks } from 'bitcoinjs-lib';
import { environment } from '../../environments/environment';
import { ConversionService } from '../conversion.service';
import { Address } from '../core/bitcoinjs/address';
import { ConfirmedTransaction } from '../core/bitcoinjs/confirmed-transaction';
import { Derivator } from '../core/bitcoinjs/derivator';
import { Derived } from '../core/bitcoinjs/derived';
import { Network } from '../core/bitcoinjs/network';
import { GetBalanceResponse } from '../core/electrum/get-balance-response';
import { GetHistoryResponseItem } from '../core/electrum/get-history-response-item';
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
    source: string;
    isLegacyAccount = false;
    gap = 20;
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
            this.source = this.route.snapshot.queryParamMap.get('source');
            this.loadBalance();
            if (this.source.substring(1, 4) === 'priv') {
                M.toast({
                    html: 'You wrote the private key in your browser address bar, ' +
                        'which means it is now probably stored in your browser history !' +
                        'Please send all the funds associated with this key to a new wallet and never use this key again.' +
                        'Or immediately delete your browser history and make sure your computer is free from malwares',
                    classes: 'red', displayLength: 9000000000
                });
            }
        }
    }

    ngAfterContentChecked() {
        M.updateTextFields();
        const elements = document.getElementsByClassName('materialize-textarea');
        for (const element of elements) {
            M.textareaAutoResize(element);
        }
    }

    onQrScan(text: string) {
        this.source = text;
    }

    isPossibleLegacyAccount() {
        return this.localStorageService.settings.bip44Enabled &&
            this.source && (
                (environment.network === networks.bitcoin && this.source.startsWith('xpub'))
                || (environment.network === networks.testnet && this.source.startsWith('tpub'))
                || (environment.network === networks.regtest && this.source.startsWith('tpub'))
            );
    }

    loadBalance() {
        const prefix = this.source.substring(1, 4);
        let address;
        if (prefix !== 'pub') {
            address = this.source;
            this.loadBalanceFromAddress(address);
        } else {
            this.loadBalanceFromExtendedKey();
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

    async loadBalanceFromExtendedKey() {
        let addressList: Array<Address>;
        let fromIndex = 0;
        let change = 0;

        let found;
        let getBalanceResponseList = new Array<GetBalanceResponse>();
        try {
            do {
                found = false;
                let derivedArray: Array<Derived>;
                if (this.isLegacyAccount && this.isPossibleLegacyAccount()) {
                    derivedArray = Derivator.deriveWithPurpose(this.source, 44, change, fromIndex, fromIndex + this.gap, environment.network);
                } else {
                    derivedArray = Derivator.derive(this.source, change, fromIndex, fromIndex + this.gap, environment.network);
                }
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
                fromIndex = fromIndex + this.gap;

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
        const prefix = this.source.substring(1, 4);
        let address;
        if (prefix !== 'pub') {
            address = this.source;
            this.loadHistoryFromAddress(address);
        } else {
            this.loadHistoryFromExtendedKey();
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

    async loadHistoryFromExtendedKey() {
        let addressList: Array<Address>;
        let fromIndex = 0;
        let change = 0;

        let found;
        let getHistoryResponseItemList = new Array<GetHistoryResponseItem>();
        let headersResponse;
        try {
            do {
                found = false;
                addressList = Derivator.derive(this.source, change, fromIndex, fromIndex + this.gap, environment.network)
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

                fromIndex = fromIndex + this.gap;

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
