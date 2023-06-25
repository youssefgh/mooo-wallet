import { AfterContentChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { networks } from 'bitcoinjs-lib';
import { environment } from '../../environments/environment';
import { Derivator } from '../core/bitcoinjs/derivator';
import { Derived } from '../core/derived';
import { LocalStorageService } from '../shared/local-storage.service';

declare const M: any;

@Component({
    selector: 'app-extended-key-derivation',
    templateUrl: './extended-key-derivation.component.html',
    styleUrls: ['./extended-key-derivation.component.css']
})
export class ExtendedKeyDerivationComponent implements OnInit, AfterContentChecked {

    environment = environment;

    key: string;
    isLegacyAccount = false;

    derivedArray: Array<Derived>;

    // purpose: number
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
        private localStorageService: LocalStorageService,
        private route: ActivatedRoute,
    ) { }

    ngOnInit() {
        if (this.route.snapshot.queryParamMap.get('key') !== null) {
            this.key = this.route.snapshot.queryParamMap.get('key');
            if (this.key.substring(1, 4) === 'priv') {
                M.toast({
                    html: 'You wrote the private key in your browser address bar, ' +
                        'which means it is now probably stored in your browser history !' +
                        'Please send all the funds associated with this key to a new wallet and never use this key again.' +
                        'Or immediately delete your browser history and make sure your computer is free from malwares',
                    classes: 'red', displayLength: 9000000000
                });
            }
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

    onQrScan(text: string) {
        this.key = text;
    }

    isPossibleLegacyAccount() {
        return this.localStorageService.settings.bip44Enabled &&
            this.key && (
                (environment.network === networks.bitcoin && this.key.startsWith('xpub'))
                || (environment.network === networks.testnet && this.key.startsWith('tpub'))
                || (environment.network === networks.regtest && this.key.startsWith('tpub'))
            );
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
        if (this.isLegacyAccount && this.isPossibleLegacyAccount()) {
            this.derivedArray = Derivator.deriveWithPurpose(this.key, 44, change, this.fromIndex, this.toIndex, environment.network);
        } else {
            this.derivedArray = Derivator.derive(this.key, change, this.fromIndex, this.toIndex, environment.network);
        }
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
