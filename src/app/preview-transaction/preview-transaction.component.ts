import {environment} from '../../environments/environment';
import {Component, OnInit} from '@angular/core';
import {Transaction} from 'bitcoinjs-lib';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {UTXO} from '../core/utxo';
import {Output} from '../core/output';

@Component({
    selector: 'app-preview-transaction',
    templateUrl: './preview-transaction.component.html',
    styleUrls: ['./preview-transaction.component.css']
})
export class PreviewTransactionComponent implements OnInit {

    transactionHex: string;
    transaction: Transaction;
    utxoArray: UTXO[] = new Array<UTXO>();

    constructor(private httpClient: HttpClient) {}

    ngOnInit() {
    }
    
    preview() {
        this.transaction = Transaction.fromHex(this.transactionHex);
//        this.transaction.ins[0].
        this.httpClient.get<UTXO[]>(environment.blockexplorerAddress + '/addr/' + /*this.transaction.*/ + '/utxo',
            {headers: new HttpHeaders()})
            .subscribe(data => {
                this.utxoArray = data;
            });
    }

}
