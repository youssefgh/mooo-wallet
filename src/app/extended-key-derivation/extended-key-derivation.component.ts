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

    // purpose: number
    change: number
    fromIndex = 0
    toIndex = 10

    @ViewChild('scrollTarget')
    scrollTarget: ElementRef;

    key: string

    derivedArray: Array<Derived>

    constructor(private route: ActivatedRoute, private walletGenerationService: WalletGenerationService) { }

    ngOnInit() {
        if (this.route.snapshot.queryParamMap.get("key") !== null) {
            this.key = this.route.snapshot.queryParamMap.get("key")
            if (this.key.substr(1, 4) == 'priv') {
                M.toast({
                    html: 'You wrote the private key in your browser address bar, which means it is now probably stored in your browser history !\
                 Please send all the funds associated with this key to a new wallet and never use this key again.\
                  Or immediately delete your browser history and make sure your computer is free from malwares', classes: 'red', displayLength: 9000000000
                });
            }
        }
    }

    ngAfterContentChecked() {
        M.updateTextFields()
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
        let nodeAndPurpose
        try {
            nodeAndPurpose = this.walletGenerationService.nodeFromKey(this.key, environment.network)
        } catch (e) {
            //TODO review
            console.error(e)
            M.toast({ html: e, classes: 'red' });
            return
        }
        let changeNode = nodeAndPurpose.node.derive(change)

        this.derivedArray = this.walletGenerationService.deriveList(nodeAndPurpose.purpose, changeNode, this.fromIndex, this.toIndex, environment.network)
        this.scrollTarget.nativeElement.scrollIntoView();
    }

    more() {
        this.toIndex += 10
        this.derive()
    }

}
