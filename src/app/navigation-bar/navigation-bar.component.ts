import {Component, OnInit, Input} from '@angular/core';

declare var $: any;

@Component({
    selector: 'navigation-bar',
    templateUrl: './navigation-bar.component.html',
    styleUrls: ['./navigation-bar.component.css']
})
export class NavigationBarComponent implements OnInit {


    @Input()
    header: string;

    constructor() {}

    ngOnInit() {
        $('.button-collapse').sideNav({
            menuWidth: 300, // Default is 300
            edge: 'left', // Choose the horizontal origin
            closeOnClick: true, // Closes side-nav on <a> clicks, useful for Angular/Meteor
            draggable: true, // Choose whether you can drag to open on touch screens,
            onOpen: function (el) {}, // A function to be called when sideNav is opened
            onClose: function (el) {} // A function to be called when sideNav is closed
        });
    }

}
