import {environment} from '../../environments/environment';
import {EnvironementService} from '../environement.service';
import {Component, OnInit} from '@angular/core';
import {TransactionBuilder, Transaction, address} from 'bitcoinjs-lib';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Big} from 'big.js';
import {UTXO} from '../core/utxo';
import {Output} from '../core/output';

@Component({
    selector: 'app-create-transaction',
    templateUrl: './create-transaction.component.html',
    styleUrls: ['./create-transaction.component.css']
})
export class CreateTransactionComponent implements OnInit {

    from: Buffer = new Buffer("mwyxJ68WgGD6F5VhYLK3iaFeRKCY4kzwEv");
    selectedDestination: string;
    selectedAmount: number;
    outputArray: Output[] = new Array<Output>();
    utxoArray: UTXO[] = new Array<UTXO>();
    transactionHex: string;
    balanceBig: Big;
    balance: number;
    transactionFeeBig: Big;
    transactionFee: number;

    environment = environment;

    constructor(private environementService: EnvironementService, private httpClient: HttpClient) {}

    ngOnInit() {
    }

    setFrom(from: string) {
        this.from = new Buffer(from);
    }

    loadUTXO() {
        this.httpClient.get<UTXO[]>(environment.blockexplorerAddress + '/addr/' + this.from + '/utxo',
            {headers: new HttpHeaders()})
            .subscribe(data => {
                this.utxoArray = data;
                this.updateBalance();
            });
    }

    calculateBalance() {
        var balance = new Big(0);
        for (let utxo of this.utxoArray) {
            balance = balance.plus(new Big(utxo.amount));
            balance.plus(new Big(0));
        }
        return balance;
    }

    calculateTransactionFee() {
        var sumAmountToBeSent = new Big(0);
        for (var i = 0; i < this.outputArray.length; i++) {
            var output = this.outputArray[i];
            sumAmountToBeSent = sumAmountToBeSent.plus(output.amount);
        }
        return this.balanceBig.minus(sumAmountToBeSent);
    }

    removeUTXO(index: number) {
        this.utxoArray.splice(index, 1);
        this.updateBalance();
    }

    addDestination() {
        this.outputArray.push(new Output(this.selectedDestination, new Big(this.selectedAmount)));
        this.selectedDestination = null;
        this.selectedAmount = null;
        this.updateTransactionFee();
    }

    removeDestination(index: number) {
        this.outputArray.splice(index, 1);
        this.updateTransactionFee();
    }

    createTransaction() {
        var network = this.environementService.network;
        var transactionBuilder = new TransactionBuilder(network);
        for (var i = 0; i < this.utxoArray.length; i++) {
            var utxo = this.utxoArray[i];
            transactionBuilder.addInput(utxo.txid, utxo.vout);
        }
        for (var i = 0; i < this.outputArray.length; i++) {
            var output = this.outputArray[i];
            transactionBuilder.addOutput(output.destination, output.amountInSatochi());
        }
        this.transactionHex = transactionBuilder.buildIncomplete().toHex();
    }

    updateBalance() {
        this.balanceBig = this.calculateBalance();
        this.balance = parseFloat(this.balanceBig.valueOf());
    }

    updateTransactionFee() {
        this.transactionFeeBig = this.calculateTransactionFee();
        this.transactionFee = parseFloat(this.transactionFeeBig.valueOf());
    }

    clean() {
        this.from = null;
        this.selectedDestination = null;
        this.selectedAmount = null;
        this.outputArray = new Array<Output>();
        this.utxoArray = new Array<UTXO>();
        this.transactionHex = null;
        this.balanceBig = null;
        this.balance = null;
    }

}