import { Component } from '@angular/core';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { SpinnerService } from './spinner/spinner.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {

    constructor(
        public spinnerService: SpinnerService,
    ) {
        bitcoinjs.initEccLib(ecc);
    }

}
