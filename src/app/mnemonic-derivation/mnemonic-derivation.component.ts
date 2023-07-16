import { AfterContentChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { environment } from '../../environments/environment';
import { Derivator } from '../core/bitcoinjs/derivator';
import { Derived } from '../core/bitcoinjs/derived';
import { HdCoin } from '../core/bitcoinjs/hd-coin';
import { HdRoot } from '../core/bitcoinjs/hd-root';
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
    fromIndex = 0;
    defaultTo = 10;
    toIndex = this.defaultTo;

    @ViewChild('scrollTarget', { static: true })
    scrollTarget: ElementRef;

    mnemonic = new Mnemonic();

    xpriv: string;
    xpub: string;

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
    }

    setBIP(purpose) {
        this.purpose = purpose;
    }

    derivationPath() {
        return 'm/' + this.purpose + '\'/' + this.coinType + '\'/' + this.account + '\'/' + this.change;
    }

    // TODO move to service
    derive() {
        const hdRoot = HdRoot.from(this.mnemonic, this.purpose, environment.network);
        const accountNode = hdRoot.deriveHardened(this.purpose).deriveHardened(this.coinType).deriveHardened(this.account);
        this.xpub = accountNode.neutered().toBase58();
        this.xpriv = accountNode.toBase58();
        let finalNode = accountNode.derive(this.change);
        this.derivedArray = Derivator.deriveList(this.purpose, finalNode, this.fromIndex, this.toIndex, environment.network);
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
