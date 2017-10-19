import {Component, OnInit} from '@angular/core';
import {EnvironementService} from '../environement.service';
import {ECPair} from 'bitcoinjs-lib';
import * as Wif from 'wif';
import * as bip38 from 'bip38';

@Component({
    selector: 'app-create-wallet',
    templateUrl: './create-wallet.component.html',
    styleUrls: ['./create-wallet.component.css'],
})
export class CreateWalletComponent implements OnInit {

    keyPair: ECPair;
    //    address: Buffer;
    address: string;
    privateKey: string;
    passphrase: string;
    encryptedKey: string;
    wif: string;

    usePassphrase: boolean;

    constructor(private environementService: EnvironementService) {}

    ngOnInit() {
    }

    generate() {
        this.keyPair = ECPair.makeRandom({network: this.environementService.network});
        this.address = this.keyPair.getAddress();
        this.wif = this.keyPair.toWIF();
        var decodedKeyPair = Wif.decode(this.keyPair.toWIF());
        this.privateKey = decodedKeyPair.privateKey.toString('hex');
        if (this.usePassphrase) {
            this.encryptedKey = bip38.encrypt(decodedKeyPair.privateKey, decodedKeyPair.compressed, this.passphrase);
        }
        console.log(Wif.encode(239, decodedKeyPair.privateKey, true));
        console.log(Wif.encode(239, new Buffer(this.privateKey,'hex'), true));
    }

    clean() {
        this.address = null;
        this.privateKey = null;
        this.passphrase = null;
        this.encryptedKey = null;
        this.wif = null;
    }

}