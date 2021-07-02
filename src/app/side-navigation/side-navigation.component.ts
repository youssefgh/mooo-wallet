import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';

declare var M: any;

@Component({
    selector: 'app-side-navigation',
    templateUrl: './side-navigation.component.html',
    styleUrls: ['./side-navigation.component.css']
})
export class SideNavigationComponent implements OnInit {

    title: string;

    constructor() { }

    ngOnInit() {
        const elems = document.querySelectorAll('.sidenav');
        M.Sidenav.init(elems, {});
        const collapsibleElem = document.querySelector('.collapsible');
        M.Collapsible.init(collapsibleElem, {});
        if (!environment.testnet) {
            this.title = 'Wallet';
        } else {
            this.title = 'Testnet Wallet';
        }
    }

}
