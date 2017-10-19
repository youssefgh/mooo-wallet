import {environment} from '../../environments/environment';
import {Component, OnInit} from '@angular/core';
import {TransactionBuilder} from 'bitcoinjs-lib';
import {HttpClient, HttpHeaders} from '@angular/common/http';
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

    environment = environment;
    //    balance: number;

    constructor(private httpClient: HttpClient) {}

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
            });
    }

    balance() {
        var balance = 0;
        for (let utxo of this.utxoArray) {
            balance += utxo.satoshis;
        }
        return balance;
    }

    txFee() {
        var sumAmountToBeSent = 0;
        for (var i = 0; i < this.outputArray.length; i++) {
            var output = this.outputArray[i];
            sumAmountToBeSent += output.amount;
        }
        return this.balance() - sumAmountToBeSent;
    }

    removeUTXO(index: number) {
        this.utxoArray.splice(index, 1);;
    }

    addDestination() {
        this.outputArray.push(new Output(this.selectedDestination, this.selectedAmount));
        this.selectedDestination = null;
        this.selectedAmount = null;
    }

    removeDestination(index: number) {
        this.outputArray.splice(index, 1);;
    }

    createTransaction() {
        //        var utx        o = new UTXO();
        //        utxo.txid = "acfc35bef87a4258843c859dee21c72f418c9740e6e24367e900827f1c2        2fb1a";        
        //        this.utxoAr        ray.push(utxo);
        //        utx        o = new UTXO();
        //        utxo.txid = "802e5967e1703cbda5d58ddae92ad470dbddc4acb51cce98eca8bf3d7da        7e2c7";        
        //        this.utxoArray.push(utxo);


        var transactionBuilder = new TransactionBuilder();
        for (var i = 0; i < this.utxoArray.length; i++) {
            var utxo = this.utxoArray[i];
            transactionBuilder.addInput(utxo.txid, i);
        }
        for (var i = 0; i < this.outputArray.length; i++) {
            var output = this.outputArray[i];
            transactionBuilder.addOutput(output.destination, output.amount);
        }
        this.transactionHex = transactionBuilder.buildIncomplete().toHex();
    }

    clean() {
        this.from = null;
        this.selectedDestination = null;
        this.selectedAmount = null;
        this.outputArray = new Array<Output>();
        this.utxoArray = new Array<UTXO>();
        this.transactionHex = null;
    }

}