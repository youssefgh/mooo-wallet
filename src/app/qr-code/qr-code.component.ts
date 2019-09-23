import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import * as qrcode from 'qrcode';

@Component({
    selector: 'qr-code',
    templateUrl: './qr-code.component.html',
    styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent implements OnInit {

    @ViewChild('qr', { static: true }) qrCanvas: ElementRef

    constructor() { }

    ngOnInit() {

    }

    @Input()
    set value(value: string) {
        if (value) {
            qrcode.toCanvas(this.qrCanvas.nativeElement, value, { errorCorrectionLevel: 'high' })
            this.qrCanvas.nativeElement.style.width = this.qrCanvas.nativeElement.parentNode.style.width
            this.qrCanvas.nativeElement.style.height = this.qrCanvas.nativeElement.parentNode.style.height
        }
    }

}
