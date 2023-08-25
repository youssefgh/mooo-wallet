import { AfterContentChecked, Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { HdWallet } from '../core/bitcoinjs/hd-wallet';
import { Mnemonic } from '../core/bitcoinjs/mnemonic';
import { P2trWallet } from '../core/bitcoinjs/p2tr-wallet';
import { P2wpkhWallet } from '../core/bitcoinjs/p2wpkh-wallet';

declare const M: any;

@Component({
    selector: 'app-create-wallet',
    templateUrl: './create-wallet.component.html',
    styleUrls: ['./create-wallet.component.css'],
})
export class CreateWalletComponent implements AfterContentChecked {

    environment = environment;

    mnemonic = new Mnemonic();
    twentyFourWordsStrength = 256;

    wallet: HdWallet;
    encryptedKey: string;

    usePassphrase: boolean;
    walletType = 'taproot';

    newP2wpkh() {
        this.mnemonic.phrase = Mnemonic.new(this.twentyFourWordsStrength).phrase;
        this.wallet = P2wpkhWallet.account(this.mnemonic, 0, this.environment.network);
    }

    newP2tr() {
        this.mnemonic.phrase = Mnemonic.new(this.twentyFourWordsStrength).phrase;
        this.wallet = P2trWallet.account(this.mnemonic, 0, this.environment.network);
    }

    clean() {
        this.mnemonic.phrase = null;
        this.mnemonic.passphrase = null;
        this.wallet = null;
        this.encryptedKey = null;
        this.usePassphrase = null;
    }

    isSegwit() {
        return this.walletType === 'segwit';
    }

    isTaproot() {
        return this.walletType === 'taproot';
    }

    ngAfterContentChecked() {
        M.updateTextFields();
        const elements = document.getElementsByClassName('materialize-textarea') as HTMLCollectionOf<HTMLElement>;
        for (const element of elements) {
            M.textareaAutoResize(element);
        }
    }

}
