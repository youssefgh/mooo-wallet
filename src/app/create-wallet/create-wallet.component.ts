import {environment} from '../../environments/environment';
import {Component, OnInit} from '@angular/core';
import {WalletGenerationService} from '../wallet-generation.service';
import {Wallet} from '../core/wallet';

declare var M: any;

@Component({
    selector: 'app-create-wallet',
    templateUrl: './create-wallet.component.html',
    styleUrls: ['./create-wallet.component.css'],
})
export class CreateWalletComponent implements OnInit {

    environment = environment;

    wallet: Wallet;
    passphrase: string;
    encryptedKey: string;

    usePassphrase: boolean;
    useNativeSegwit: boolean;

    constructor(private walletGenerationService: WalletGenerationService) {}

    ngOnInit() {
        //TODO enable after MaterializeCSS bug fix
        //        let elem = document.querySelector('.tooltipped');
        //        new M.Tooltip(elem, {});
        //let instance = M.Tooltip.init(elem, {});
    }

    newSegwitP2wpkhInP2sh() {
        this.wallet = this.walletGenerationService.newP2wpkhInP2sh();
        if (this.usePassphrase) {
            this.encryptedKey = this.walletGenerationService.encrypt(this.wallet.wif, this.passphrase);
        }
    }

    newP2wpkh() {
        this.wallet = this.walletGenerationService.newP2wpkh();
        if (this.usePassphrase) {
            this.encryptedKey = this.walletGenerationService.encrypt(this.wallet.wif, this.passphrase);
        }
    }

    clean() {
        this.wallet = null;
        this.passphrase = null;
        this.encryptedKey = null;
        this.usePassphrase = null;
        this.useNativeSegwit = null;
    }

}