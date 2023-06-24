import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { HdWallet } from '../core/bitcoinjs/hdWallet';
import { Mnemonic } from '../core/bitcoinjs/mnemonic';
import { P2trWallet } from '../core/bitcoinjs/p2trWallet';
import { P2wpkhInP2shWallet } from '../core/bitcoinjs/p2wpkhInP2shWallet';
import { P2wpkhWallet } from '../core/bitcoinjs/p2wpkhWallet';

@Component({
    selector: 'app-create-wallet',
    templateUrl: './create-wallet.component.html',
    styleUrls: ['./create-wallet.component.css'],
})
export class CreateWalletComponent {

    environment = environment;

    mnemonic = new Mnemonic;

    wallet: HdWallet;
    encryptedKey: string;

    usePassphrase: boolean;
    walletType = 'taproot';

    newSegwitP2wpkhInP2sh() {
        this.mnemonic.phrase = Mnemonic.new().phrase;
        this.wallet = P2wpkhInP2shWallet.account0(this.mnemonic, this.environment.network);
    }

    newP2wpkh() {
        this.mnemonic.phrase = Mnemonic.new().phrase;
        this.wallet = P2wpkhWallet.account0(this.mnemonic, this.environment.network);
    }

    newP2tr() {
        this.mnemonic.phrase = Mnemonic.new().phrase;
        this.wallet = P2trWallet.account0(this.mnemonic, this.environment.network);
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

}
