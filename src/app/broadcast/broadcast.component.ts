import { Location } from '@angular/common';
import { AfterContentChecked, Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { JsonRpcResponse } from '../core/electrum/json-rpc-response';
import { BroadcastService } from './broadcast.service';

declare const M: any;

@Component({
    selector: 'app-broadcast',
    templateUrl: './broadcast.component.html',
    styleUrls: ['./broadcast.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class BroadcastComponent implements AfterContentChecked {

    signedTransaction: string;

    constructor(
        private location: Location,
        private router: Router,
        private service: BroadcastService,
    ) {
        const extras = this.router.getCurrentNavigation().extras;
        if (extras.state?.data) {
            this.signedTransaction = extras.state.data;
        }
    }


    ngAfterContentChecked() {
        M.updateTextFields();
        const elements = document.getElementsByClassName('materialize-textarea');
        for (const element of elements) {
            M.textareaAutoResize(element);
        }
    }

    onSourceQrScan(text: string) {
        this.signedTransaction = text;
    }

    async broadcast() {
        try {
            const data = await this.service.broadcast(this.signedTransaction,
                environment.electrumProtocol, environment.proxyAddress);
            let responseList = new Array<JsonRpcResponse>();
            for (const responseString of data) {
                const responseObject = JsonRpcResponse.from(responseString);
                responseList.push(responseObject);
            }
            responseList = responseList.sort((a, b) => a.id > b.id ? 1 : -1);
            const response = responseList[1];
            M.toast({ html: 'Sending complete ! Tx:' + response.result, classes: 'green' });
        } catch (error) {
            M.toast({ html: error, classes: 'red' });
        }
    }

    clear() {
        this.signedTransaction = null;
        this.location.replaceState('./Sign');
    }

}
