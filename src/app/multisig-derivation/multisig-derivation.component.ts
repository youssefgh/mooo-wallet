import { AfterContentChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { environment } from '../../environments/environment';
import { Derivator } from '../core/bitcoinjs/derivator';
import { Derived } from '../core/bitcoinjs/derived';
import { HdCoin } from '../core/bitcoinjs/hd-coin';
import { OutputDescriptor } from '../core/output-descriptor';
import { OutputDescriptorKey } from '../core/output-descriptor-key';

declare const M: any;

@Component({
    selector: 'app-multisig-derivation',
    templateUrl: './multisig-derivation.component.html',
    styleUrls: ['./multisig-derivation.component.css']
})
export class MultisigDerivationComponent implements OnInit, AfterContentChecked {

    environment = environment;

    purpose = 48;
    coinType: number;
    account = 0;
    change = 0;
    script = 2;
    keyNumber = 2;
    descriptorKeyList = new Array<string>;
    threshold = 1;
    fromIndex = 0;
    defaultTo = 10;
    toIndex = this.defaultTo;

    @ViewChild('scrollTarget', { static: true })
    scrollTarget: ElementRef;

    descriptor: string;

    derivedArray: Array<Derived>;

    selectedQr: string;
    qrModal;

    @ViewChild('qrModal', { static: true })
    qrModalRef: ElementRef;

    ngOnInit() {
        this.coinType = HdCoin.id(environment.network);
        this.descriptorKeyListUpdate();

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

    descriptorKeyListUpdate() {
        this.descriptorKeyList.length = this.keyNumber;
    }

    deriveMultisig() {
        const outputDescriptor = new OutputDescriptor();
        outputDescriptor.script = 'wsh';
        outputDescriptor.threshold = this.threshold;
        outputDescriptor.sortedmultiParamList = this.descriptorKeyList.map(descriptorKey => OutputDescriptorKey.from(descriptorKey));
        this.descriptor = outputDescriptor.toString();
        this.derivedArray = Derivator.derive(this.descriptor, this.change, this.fromIndex, this.toIndex, environment.network);

        this.scrollTarget.nativeElement.scrollIntoView();
    }

    more() {
        this.toIndex += this.defaultTo;
        this.deriveMultisig();
    }

    showQr(qr: string) {
        this.selectedQr = qr;
        this.qrModal.open();
    }

}
