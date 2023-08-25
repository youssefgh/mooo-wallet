import { Location } from '@angular/common';
import { AfterContentChecked, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Mnemonic } from '../core/bitcoinjs/mnemonic';
import { Psbt, SignResult } from '../core/bitcoinjs/psbt';
import { PsbtTransactionDetails } from '../core/psbt-transaction-details';

declare const M: any;

@Component({
    selector: 'app-sign',
    templateUrl: './sign.component.html',
    styleUrls: ['./sign.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class SignComponent implements OnInit, AfterContentChecked {

    psbtString: string;

    psbt: Psbt;
    psbtTransactionDetails: PsbtTransactionDetails;
    signResult: SignResult;

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
        if (extras.state?.data) {
            this.psbtString = extras.state.data;
            this.load();
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
        this.psbtString = text;
    }

    load() {
        try {
            let psbt: Psbt;
            try {
                psbt = Psbt.fromBase43(this.psbtString, this.environment.network);
            } catch (error) {
            }
            if (!psbt) {
                psbt = Psbt.fromBase64(this.psbtString, this.environment.network);
            }
            this.psbtTransactionDetails = PsbtTransactionDetails.from(psbt.object, this.environment.network);
            this.psbt = psbt;
        } catch (error) {
            alert('Error while importing PSBT');
            console.error((error as Error).stack);
        }
    }

    sign() {
        const signResult = this.psbt.sign(this.mnemonic);
        if (signResult?.signedTransaction) {
            this.psbtTransactionDetails.calculateFees();
        }
        this.signResult = signResult;
    }

    showQr(qr: string) {
        this.selectedQr = qr;
        this.qrModal.open();
    }

    async broadcast() {
        this.router.navigate(['./broadcast'], { state: { data: this.signResult.signedTransaction } });
    }

    clear() {
        this.psbtString = null;
        this.psbt = null;
        this.signResult = null;
        this.mnemonic = new Mnemonic;
        this.location.replaceState('./sign');
    }

}