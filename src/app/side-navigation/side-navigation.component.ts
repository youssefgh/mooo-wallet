import {environment} from '../../environments/environment';
import {Component, OnInit} from '@angular/core';

declare var M: any;

@Component({
    selector: 'side-navigation',
    templateUrl: './side-navigation.component.html',
    styleUrls: ['./side-navigation.component.css']
})
export class SideNavigationComponent implements OnInit {

    title: string;

    constructor() {}

    ngOnInit() {
        let elems = document.querySelectorAll('.sidenav')
        let instances = M.Sidenav.init(elems, {})
        let collapsibleElem = document.querySelector('.collapsible')
        let collapsibleInstance = M.Collapsible.init(collapsibleElem, {})
        if (!environment.testnet) {
            this.title = "Wallet";
        } else {
            this.title = "Testnet Wallet";
        }
    }

}
