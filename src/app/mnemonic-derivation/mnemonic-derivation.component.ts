import { environment } from '../../environments/environment';
import { Component, OnInit, AfterContentChecked, ViewChild, ElementRef } from '@angular/core';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import { WalletGenerationService } from '../wallet-generation.service';
import { Derived } from '../core/derived';

declare var M: any;

@Component({
    selector: 'app-mnemonic-derivation',
    templateUrl: './mnemonic-derivation.component.html',
    styleUrls: ['./mnemonic-derivation.component.css']
})
export class MnemonicDerivationComponent implements OnInit, AfterContentChecked {

    environment = environment

    customDerivationPath = "m/"
    customDerivation = false
    purpose: number
    coinType: number
    account = 0
    change = 0
    fromIndex = 0
    defaultTo = 10
    toIndex = this.defaultTo

    @ViewChild('scrollTarget', { static: true })
    scrollTarget: ElementRef

    mnemonic: string
    passphrase: string

    xpriv: string
    xpub: string

    derivedArray: Array<Derived>

    selectedQr: string
    qrModal

    @ViewChild('qrModal', { static: true })
    qrModalRef: ElementRef

    constructor(private walletGenerationService: WalletGenerationService) { }

    ngOnInit() {
        this.coinType = this.walletGenerationService.coinType(environment.network)
        this.setBIP(49)

        const elem = this.qrModalRef.nativeElement
        this.qrModal = M.Modal.init(elem, {})
    }

    ngAfterContentChecked() {
        M.updateTextFields()
    }

    setBIP(purpose) {
        this.purpose = purpose
        this.customDerivation = false
    }

    derivationPath() {
        return "m/" + this.purpose + "'/" + this.coinType + "'/" + this.account + "'/" + this.change
    }

    setCustom() {
        this.customDerivation = true
    }

    //TODO move to service
    derive() {
        const hdRoot = this.walletGenerationService.hdRootFrom(this.mnemonic, this.passphrase, this.purpose, environment.network)
        let finalNode
        if (this.customDerivation) {
            try {
                finalNode = hdRoot.derivePath(this.customDerivationPath)
            } catch (e) {
                M.toast({ html: 'Incorrect derivation path !', classes: 'red' })
                console.error(e)
                return
            }
        } else {
            const accountNode = hdRoot.deriveHardened(this.purpose).deriveHardened(this.coinType).deriveHardened(this.account)
            this.xpub = accountNode.neutered().toBase58()
            this.xpriv = accountNode.toBase58()
            finalNode = accountNode.derive(this.change)
        }
        this.derivedArray = this.walletGenerationService.deriveList(this.purpose, finalNode, this.fromIndex, this.toIndex, environment.network)
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
