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
    // derivationPath: string
    purpose: number
    coinType: number
    account = 0
    change = 0
    fromIndex = 0
    toIndex = 10

    @ViewChild('scrollTarget', { static: true })
    scrollTarget: ElementRef;

    mnemonic: string = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    passphrase: string

    xpriv: string
    xpub: string

    derivedArray: Array<Derived>

    constructor(private walletGenerationService: WalletGenerationService) { }

    ngOnInit() {
        this.coinType = this.walletGenerationService.coinType(environment.network)
        this.setBIP(49)
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
        const node = this.walletGenerationService.nodeFrom(this.mnemonic, this.passphrase, this.purpose, environment.network)
        let finalNode
        if (this.customDerivation) {
            try {
                finalNode = node.derivePath(this.customDerivationPath)
            } catch (e) {
                M.toast({ html: 'Incorrect derivation path !', classes: 'red' });
                console.error(e)
                return
            }
        } else {
            const accountNode = node.deriveHardened(this.purpose).deriveHardened(this.coinType).deriveHardened(this.account)
            this.xpub = accountNode.neutered().toBase58()
            this.xpriv = accountNode.toBase58()
            finalNode = accountNode.derive(this.change)
        }
        this.derivedArray = this.walletGenerationService.deriveList(this.purpose, finalNode, this.fromIndex, this.toIndex, environment.network)
        this.scrollTarget.nativeElement.scrollIntoView();
    }

    more() {
        this.toIndex += 10
        this.derive()
    }

}
