import { environment } from '../../environments/environment';
import { Component, OnInit, ViewChild, ElementRef, AfterContentChecked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WalletGenerationService } from '../wallet-generation.service';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as bip32 from 'bip32';
import { Derived } from '../core/derived';

declare var M: any;

@Component({
    selector: 'app-extended-key-derivation',
    templateUrl: './extended-key-derivation.component.html',
    styleUrls: ['./extended-key-derivation.component.css']
})
export class ExtendedKeyDerivationComponent implements OnInit, AfterContentChecked {

    environment = environment

    key: string

    derivedArray: Array<Derived>

    // purpose: number
    change: number
    fromIndex = 0
    defaultTo = 10
    toIndex = this.defaultTo

    selectedQr: string
    qrModal

    @ViewChild('qrModal', { static: true })
    qrModalRef: ElementRef

    @ViewChild('scrollTarget', { static: true })
    scrollTarget: ElementRef

    constructor(private route: ActivatedRoute, private walletGenerationService: WalletGenerationService) { }

    ngOnInit() {
        if (this.route.snapshot.queryParamMap.get("key") !== null) {
            this.key = this.route.snapshot.queryParamMap.get("key")
            if (this.key.substr(1, 4) == 'priv') {
                M.toast({
                    html: 'You wrote the private key in your browser address bar, which means it is now probably stored in your browser history !\
                 Please send all the funds associated with this key to a new wallet and never use this key again.\
                  Or immediately delete your browser history and make sure your computer is free from malwares', classes: 'red', displayLength: 9000000000
                })
            }
        }
        const elem = this.qrModalRef.nativeElement
        this.qrModal = M.Modal.init(elem, {})
    }

    ngAfterContentChecked() {
        M.updateTextFields()
        const elements = document.getElementsByClassName('materialize-textarea')
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i]
            M.textareaAutoResize(element)
        }
    }

    onQrScan(text: string) {
        this.key = text
    }

    deriveReceiving() {
        this.change = 0
        this.derive(this.change)
    }

    deriveChange() {
        this.change = 1
        this.derive(this.change)
    }

    derive(change?) {
        if (change === undefined) {
            change = this.change
        }
        this.derivedArray = this.walletGenerationService.derive(this.key, change, this.fromIndex, this.toIndex, environment.network)
        this.scrollTarget.nativeElement.scrollIntoView()
    }

    more() {
        this.toIndex += this.defaultTo
        this.derive()
    }

    showQr(qr: string) {
        this.selectedQr = qr
        this.qrModal.open()
    }

}
