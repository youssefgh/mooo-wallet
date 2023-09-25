import { AfterContentChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { Derived } from '../core/bitcoinjs/derived';
import { OutputDescriptor } from '../core/output-descriptor';
import { QrCodeReaderComponent } from '../qr-code-reader/qr-code-reader.component';

declare const M: any;

@Component({
    selector: 'app-descriptor-derivation',
    templateUrl: './descriptor-derivation.component.html',
    styleUrls: ['./descriptor-derivation.component.css']
})
export class DescriptorDerivationComponent implements OnInit, AfterContentChecked {

    environment = environment;
    qrCodeReaderComponent: QrCodeReaderComponent;

    descriptor: string;
    derivedArray: Array<Derived>;

    change: number;
    fromIndex = 0;
    defaultTo = 10;
    toIndex = this.defaultTo;

    selectedQr: string;
    qrModal;

    @ViewChild('qrModal', { static: true })
    qrModalRef: ElementRef;

    @ViewChild('scrollTarget', { static: true })
    scrollTarget: ElementRef;

    constructor(
        private route: ActivatedRoute,
    ) { }

    ngOnInit() {
        if (this.route.snapshot.queryParamMap.get('descriptor') !== null) {
            this.descriptor = this.route.snapshot.queryParamMap.get('descriptor');
        }
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

    onQrReaderCreated(qrCodeReaderComponent: QrCodeReaderComponent) {
        this.qrCodeReaderComponent = qrCodeReaderComponent;
    }

    onQrScan(text: string) {
        this.descriptor = text;
        this.qrCodeReaderComponent.stopDecodeFromVideoDevice();
    }

    deriveReceiving() {
        this.change = 0;
        this.derive(this.change);
    }

    deriveChange() {
        this.change = 1;
        this.derive(this.change);
    }

    derive(change?: number) {
        if (change === undefined) {
            change = this.change;
        }
        const outputDescriptor = OutputDescriptor.from(this.descriptor);
        this.derivedArray = outputDescriptor.derive(change, this.fromIndex, this.toIndex, environment.network);

        this.scrollTarget.nativeElement.scrollIntoView();
    }

    more() {
        this.toIndex += this.defaultTo;
        this.derive();
    }

    showQr(qr: string) {
        this.selectedQr = qr;
        this.qrModal.open();
    }

}
