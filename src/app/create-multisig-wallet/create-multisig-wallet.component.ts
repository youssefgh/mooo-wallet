import { AfterContentChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { environment } from '../../environments/environment';
import { OutputDescriptor } from '../core/output-descriptor';
import { OutputDescriptorKey } from '../core/output-descriptor-key';
import { QrCodeReaderComponent } from '../qr-code-reader/qr-code-reader.component';

declare const M: any;

@Component({
    selector: 'app-create-multisig-wallet',
    templateUrl: './create-multisig-wallet.component.html',
    styleUrls: ['./create-multisig-wallet.component.css']
})
export class CreateMultisigWalletComponent implements OnInit, AfterContentChecked {

    environment = environment;

    descriptorKeyItemQrCodeReaderComponent: QrCodeReaderComponent;

    descriptorKeyItem: string;
    descriptorKeyList = new Array<string>;
    threshold = 1;

    descriptor: string;

    selectedQr: string;
    qrModal;

    @ViewChild('qrModal', { static: true })
    qrModalRef: ElementRef;

    ngOnInit() {
        const elem = this.qrModalRef.nativeElement;
        this.qrModal = M.Modal.init(elem, {});
    }

    ngAfterContentChecked() {
        M.updateTextFields();
        const elements = document.getElementsByClassName('materialize-textarea') as HTMLCollectionOf<HTMLElement>;
        for (const element of elements) {
            M.textareaAutoResize(element);
        }
    }

    onDescriptorKeyItemQrReaderCreated(qrCodeReaderComponent: QrCodeReaderComponent) {
        this.descriptorKeyItemQrCodeReaderComponent = qrCodeReaderComponent;
    }

    onDescriptorKeyItemQrScan(text: string) {
        this.descriptorKeyItem = text;
        this.descriptorKeyItemQrCodeReaderComponent.stopDecodeFromVideoDevice();
    }

    addDescriptorKeyItem() {
        if (!OutputDescriptorKey.isValid(this.descriptorKeyItem)) {
            M.toast({ html: 'Invalid descriptor key !', classes: 'red' });
            return;
        }
        this.descriptorKeyList.push(this.descriptorKeyItem);
        this.descriptorKeyItem = null;
    }

    removeDescriptorKeyItem(i: number) {
        this.descriptorKeyList.splice(i, 1);
    }

    createMultisig() {
        const outputDescriptor = new OutputDescriptor();
        outputDescriptor.script = 'wsh';
        outputDescriptor.threshold = this.threshold;
        outputDescriptor.sortedmultiParamList = this.descriptorKeyList.map(descriptorKey => OutputDescriptorKey.from(descriptorKey));
        this.descriptor = outputDescriptor.toString();
    }

    showQr(qr: string) {
        this.selectedQr = qr;
        this.qrModal.open();
    }

    clear() {
        this.descriptorKeyItem = null;
        this.descriptorKeyList = new Array<string>;
        this.threshold = 1;
        this.descriptor = null;
    }

}
