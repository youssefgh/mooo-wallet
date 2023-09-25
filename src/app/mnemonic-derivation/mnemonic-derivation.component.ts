import { AfterContentChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { environment } from '../../environments/environment';
import { Derivator } from '../core/bitcoinjs/derivator';
import { Derived } from '../core/bitcoinjs/derived';
import { HdCoin } from '../core/bitcoinjs/hd-coin';
import { Mnemonic } from '../core/bitcoinjs/mnemonic';

declare const M: any;

@Component({
    selector: 'app-mnemonic-derivation',
    templateUrl: './mnemonic-derivation.component.html',
    styleUrls: ['./mnemonic-derivation.component.css']
})
export class MnemonicDerivationComponent implements OnInit, AfterContentChecked {

    environment = environment;

    purpose: number;
    coinType: number;
    account = 0;
    change = 0;
    script = 2;
    fromIndex = 0;
    defaultTo = 10;
    toIndex = this.defaultTo;

    @ViewChild('scrollTarget', { static: true })
    scrollTarget: ElementRef;

    mnemonic = new Mnemonic();

    privateDescriptorKey: string;
    publicDescriptorKey: string;
    privateDescriptor: string;
    publicDescriptor: string;

    derivedArray: Array<Derived>;

    selectedQr: string;
    qrModal;

    @ViewChild('qrModal', { static: true })
    qrModalRef: ElementRef;

    ngOnInit() {
        this.coinType = HdCoin.id(environment.network);
        this.setBIP(84);

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

    setBIP(purpose) {
        this.purpose = purpose;
    }

    derive() {
        const script = (this.purpose === 48) ? this.script : null;
        const deriveListFromMnemonicResult = Derivator.deriveListFromMnemonic(this.mnemonic, this.purpose, this.coinType, this.account, script, this.change, this.fromIndex, this.toIndex, environment.network);
        this.publicDescriptorKey = deriveListFromMnemonicResult.publicDescriptorKey;
        this.privateDescriptorKey = deriveListFromMnemonicResult.privateDescriptorKey;
        this.publicDescriptor = deriveListFromMnemonicResult.publicDescriptor;
        this.privateDescriptor = deriveListFromMnemonicResult.privateDescriptor;
        this.derivedArray = deriveListFromMnemonicResult.derivedArray;

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
