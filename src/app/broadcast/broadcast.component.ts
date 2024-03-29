import { Location } from '@angular/common';
import { AfterContentChecked, Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { URDecoder } from '@ngraveio/bc-ur';
import { environment } from '../../environments/environment';
import { JsonRpcResponse } from '../core/electrum/json-rpc-response';
import { UrDecoderUtils } from '../core/ur-decoder-utils';
import { QrCodeReaderComponent } from '../qr-code-reader/qr-code-reader.component';
import { BroadcastService } from './broadcast.service';

declare const M: any;

@Component({
    selector: 'app-broadcast',
    templateUrl: './broadcast.component.html',
    styleUrls: ['./broadcast.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class BroadcastComponent implements AfterContentChecked {

    qrCodeReaderComponent: QrCodeReaderComponent;
    urDecoder = new URDecoder();
    signedTransaction: string;

    constructor(
        private location: Location,
        private router: Router,
        private service: BroadcastService,
    ) {
        const extras = this.router.getCurrentNavigation().extras;
        if (extras.state?.data) {
            this.signedTransaction = extras.state.data;
            this.broadcast();
        }
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

    onSourceQrScan(text: string) {
        if (UrDecoderUtils.isUr(text)) {
            const ur = UrDecoderUtils.decode(text, this.urDecoder);
            if (ur.error) {
                M.toast({ html: `${ur.error} !`, classes: 'red' });
                console.error(ur.error);
                return;
            }
            if (ur.message) {
                this.signedTransaction = ur.message;
                this.qrCodeReaderComponent.stopDecodeFromVideoDevice();
                this.urDecoder = new URDecoder();
            }
        } else {
            this.signedTransaction = text;
            this.qrCodeReaderComponent.stopDecodeFromVideoDevice();
        }
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
        this.urDecoder = new URDecoder();
        this.signedTransaction = null;
        this.location.replaceState('./Sign');
    }

}
