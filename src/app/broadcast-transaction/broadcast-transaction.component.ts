import {environment} from '../../environments/environment';
import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BroadcastMessage} from '../core/broadcast-message';
import {BroadcastResponse} from '../core/bitpay/broadcast-response';

@Component({
    selector: 'app-broadcast-transaction',
    templateUrl: './broadcast-transaction.component.html',
    styleUrls: ['./broadcast-transaction.component.css']
})
export class BroadcastTransactionComponent implements OnInit {

    signedTransactionHex: string;
    broadcastResponse: BroadcastResponse;

    constructor(private httpClient: HttpClient) {}

    ngOnInit() {
    }

    broadcast() {
        this.httpClient.post<BroadcastResponse>(environment.blockexplorerAddress + '/tx/send',
            new BroadcastMessage(this.signedTransactionHex))
            .subscribe(data => {
                this.broadcastResponse = data;
            });
    }

}
