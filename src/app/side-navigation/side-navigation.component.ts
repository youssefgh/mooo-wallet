import {environment} from '../../environments/environment';
import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'side-navigation',
    templateUrl: './side-navigation.component.html',
    styleUrls: ['./side-navigation.component.css']
})
export class SideNavigationComponent implements OnInit {

    title: string;

    constructor() {}

    ngOnInit() {
        if (!environment.testnet) {
            this.title = "Wallet";
        } else {
            this.title = "Testnet Wallet";
        }
    }

}
