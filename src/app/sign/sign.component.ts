import { AfterContentChecked, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Big } from 'big.js';
import { environment } from '../../environments/environment';
import { Mnemonic } from '../core/bitcoinjs/mnemonic';
import { Psbt } from '../core/bitcoinjs/psbt';
import { PsbtTransactionDetails } from '../core/psbt-transaction-details';
import { Location } from '@angular/common';

declare const M: any;

@Component({
    selector: 'app-sign',
    templateUrl: './sign.component.html',
    styleUrls: ['./sign.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class SignComponent implements OnInit, AfterContentChecked {

    unsignedTransaction: string;

    psbt: Psbt;
    psbtTransactionDetails: PsbtTransactionDetails;

    mnemonic = new Mnemonic;

    environment = environment;

    selectedQr: string;
    qrModal;

    @ViewChild('qrModal', { static: true })
    qrModalRef: ElementRef;

    constructor(
        private location: Location,
        private router: Router,
    ) {
        const extras = this.router.getCurrentNavigation().extras;
        if(extras.state?.data){
            this.unsignedTransaction = extras.state.data;
        }
    }

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
        this.unsignedTransaction = text;
    }

    load() {
        try {
            let psbt: Psbt;
            try {
                psbt = Psbt.fromBase43(this.unsignedTransaction, this.environment.network);
            } catch (error) {
            }
            if (!psbt) {
                psbt = Psbt.fromBase64(this.unsignedTransaction, this.environment.network);
            }
            this.psbtTransactionDetails = PsbtTransactionDetails.from(psbt.object, this.environment.network);
            this.psbt = psbt;
        } catch (error) {
            alert('Error while importing PSBT');
            console.error((error as Error).stack);
        }
    }

    sign() {
        this.psbt.sign(this.mnemonic);
        this.psbtTransactionDetails.calculateFees();
    }

    showQr(qr: string) {
        this.selectedQr = qr;
        this.qrModal.open();
    }

    async broadcast() {
        this.router.navigate(['./Broadcast'], { state: { data: this.psbt.signedTransaction } });
    }

    clear() {
        this.unsignedTransaction = null;
        this.psbt = null;
        this.mnemonic = new Mnemonic;
        this.location.replaceState('./Sign');
    }

}
