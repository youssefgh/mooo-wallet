import {Component, OnInit, Input} from '@angular/core';

declare var M: any;

@Component({
    selector: 'navigation-bar',
    templateUrl: './navigation-bar.component.html',
    styleUrls: ['./navigation-bar.component.css']
})
export class NavigationBarComponent implements OnInit {


    @Input()
    header: string;
    sideNav: any;

    constructor() {}

    ngOnInit() {
        let sideNavElement = document.querySelector('#slide-out');
        this.sideNav = new M.Sidenav(sideNavElement, {});
    }

    //TODO remove workaround
    openSideNav() {
        this.sideNav.open();
    }

}
