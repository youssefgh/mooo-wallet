import { environment } from '../../environments/environment';
import { SendService } from '../send.service';
import { Component, OnInit } from '@angular/core';
import { Transaction } from '../core/transaction';
import { BalanceService } from '../balance.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ConversionService } from '../conversion.service';
import { Observable, Subscription, forkJoin, EMPTY } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { WalletGenerationService } from '../wallet-generation.service';
import { JsonRpcResponse } from '../core/electrum/json-rpc-response';
import { expand } from 'rxjs/operators';
import { Derived } from '../core/derived';
import { Big } from 'big.js';

declare var M: any;

@Component({
    selector: 'app-balance',
    templateUrl: './balance.component.html',
    styleUrls: ['./balance.component.css']
})
export class BalanceComponent implements OnInit {

    environment = environment
    source: string
    gap = 20
    confirmedBalance: string
    unconfirmedBalance: string
    private bigConfirmedBalance: Big
    private bigUnconfirmedBalance: Big
    transactionArray: Transaction[]

    constructor(private route: ActivatedRoute, private router: Router, private balanceService: BalanceService,
        private conversionService: ConversionService, private sendService: SendService,
        private walletGenerationService: WalletGenerationService) { }

    ngOnInit() {
        if (this.route.snapshot.queryParamMap.get("source") !== null) {
            this.source = this.route.snapshot.queryParamMap.get("source")
            this.loadBalance()
            if (this.source.substr(1, 4) == 'priv') {
                M.toast({
                    html: 'You wrote the private key in your browser address bar, which means it is now probably stored in your browser history !\
                 Please send all the funds associated with this key to a new wallet and never use this key again.\
                  Or immediately delete your browser history and make sure your computer is free from malwares', classes: 'red', displayLength: 9000000000
                });
            }
        }
    }

    loadBalance() {
        const prefix = this.source.substr(1, 3)
        let address
        if (prefix !== "pub") {
            address = this.source
            this.loadBalanceFromAddress(address)
        } else {
            let derivedList
            let fromIndex = 0
            let gap = this.gap
            let toIndex = gap
            let change = 0
            let repeat
            derivedList = this.walletGenerationService.derive(this.source, change, fromIndex, toIndex, environment.network)
            let lastUsedIndex = -1
            let usedAddressList = new Array
            this.balanceService.loadHistoryFrom(derivedList, environment).pipe(expand((transactionArrayArray) => {
                if (!repeat) {
                    if (toIndex - lastUsedIndex >= gap) {
                        if (change === 0) {
                            change = 1
                            fromIndex = 0
                            toIndex = gap
                            lastUsedIndex = -1
                            //TODO check change gap
                            // gap = 1
                        } else {
                            this.loadBalanceFromList(usedAddressList)
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
                derivedList = this.walletGenerationService.derive(this.source, change, fromIndex, toIndex, environment.network)
                return this.balanceService.loadHistoryFrom(derivedList, environment)
            })).subscribe(transactionArrayArray => {
                repeat = false
                if (!(transactionArrayArray instanceof Observable)) {
                    for (let index = 0; index < transactionArrayArray.length; index++) {
                        const transactionArray = transactionArrayArray[index]
                        if (transactionArray.length !== 0) {
                            usedAddressList.push(derivedList[index].address)
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
    }

    loadBalanceFromAddress(address: string) {
        if (address == null || !this.sendService.isValidAddress(address, environment.network)) {
            M.toast({ html: 'Incorrect address !' })
        } else {
            let addressList = new Array
            addressList.push(address)
            this.loadBalanceFromList(addressList)
        }
    }

    loadBalanceFromList(addressList: Array<string>) {
        this.balanceService.loadBalanceFrom(addressList, environment).subscribe((responseList) => {
            if (responseList instanceof Observable) {
                return
            }
            let confirmedBalance = new Big(0)
            let unconfirmedBalance = new Big(0)
            for (let index = 1; index < responseList.length; index++) {
                const result = responseList[index].result
                confirmedBalance = confirmedBalance.plus(result.confirmed)
                unconfirmedBalance = unconfirmedBalance.plus(result.unconfirmed)
            }
            this.confirmedBalance = this.conversionService.bigSatoshiToBitcoin(confirmedBalance).valueOf()
            this.unconfirmedBalance = this.conversionService.bigSatoshiToBitcoin(unconfirmedBalance).valueOf()
            this.bigConfirmedBalance = confirmedBalance
            this.bigUnconfirmedBalance = unconfirmedBalance
        }, (error: HttpErrorResponse) => {
            // M.toast({ html: 'Error while connecting to the proxy server! please try again later' })
            M.toast({ html: 'Error while getting the balance ! ' + error.message })
            console.error(error)
        })
    }

    reloadBalance() {
        this.confirmedBalance = null
        this.unconfirmedBalance = null
        this.transactionArray = null
        this.loadBalance()
    }

    loadHistory() {
        const prefix = this.source.substr(1, 3)
        if (prefix !== "pub") {
            let derived = new Derived
            derived.address = this.source
            let derivedList = new Array<Derived>()
            derivedList.push(derived)
            this.loadHistoryFromList(derivedList, this.bigUnconfirmedBalance, this.bigConfirmedBalance)
        } else {
            let fromIndex = 0
            let gap = this.gap
            let toIndex = gap
            let change = 0
            let repeat
            let derivedList = this.walletGenerationService.derive(this.source, change, fromIndex, toIndex, environment.network)
            let lastUsedIndex = -1
            let usedDerivedList = new Array<Derived>()
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
                            this.loadHistoryFromList(usedDerivedList, this.bigUnconfirmedBalance, this.bigConfirmedBalance)
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
                derivedList = this.walletGenerationService.derive(this.source, change, fromIndex, toIndex, environment.network)
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
    }

    loadHistoryFromList(derivedList: Array<Derived>, bigUnconfirmedBalance: Big, bigConfirmedBalance: Big) {
        this.balanceService.loadHistoryFrom(derivedList, environment).subscribe(transactionArrayArray => {
            if (transactionArrayArray instanceof Observable) {
                return
            }
            this.balanceService.transactionOf(derivedList, transactionArrayArray, environment).subscribe(transactionArrayArray => {
                let balance = new Big(0)
                //TODO refactor
                let transactionArrayTemp = new Array<Transaction>()
                for (let transactionArray of transactionArrayArray) {
                    for (let transaction of transactionArray) {
                        transaction.amount = parseFloat(this.conversionService.satoshiToBitcoin(transaction.satoshis).valueOf())
                        balance = balance.plus(transaction.satoshis)
                        transactionArrayTemp.push(transaction)
                    }
                }
                let totalBalance = bigConfirmedBalance.plus(bigUnconfirmedBalance)
                if (!balance.eq(totalBalance)) {
                    console.error('balance :' + balance + 'different than confirmedBalance: ' + this.confirmedBalance + ' and unconfirmedBalance: ' + this.unconfirmedBalance)
                }
                transactionArrayTemp = transactionArrayTemp.sort((a, b) => a.confirmations > b.confirmations ? 1 : -1)
                this.transactionArray = transactionArrayTemp
            })
        }, (error: HttpErrorResponse) => {
            M.toast({ html: 'Error while connecting to the proxy server! please try again later' })
            console.error(error)
        })
    }

    clear() {
        this.source = null
        this.confirmedBalance = null
        this.unconfirmedBalance = null
        this.transactionArray = null
        this.router.navigate([], { relativeTo: this.route })
    }

}
