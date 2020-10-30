import { Component, OnInit, Input } from '@angular/core';

declare var M: any;

@Component({
    selector: 'app-navigation-bar',
    templateUrl: './navigation-bar.component.html',
    styleUrls: ['./navigation-bar.component.css']
})
export class NavigationBarComponent implements OnInit {


    @Input()
    header: string;
    sideNav: any;

    constructor() { }

    ngOnInit() {
        const sideNavElement = document.querySelector('#slide-out');
        this.sideNav = new M.Sidenav(sideNavElement, {});
    }

}
