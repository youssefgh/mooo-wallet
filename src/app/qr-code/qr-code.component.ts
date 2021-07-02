import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as qrcode from 'qrcode';

@Component({
    selector: 'app-qr-code',
    templateUrl: './qr-code.component.html',
    styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent {

    @ViewChild('qr', { static: true }) qrCanvas: ElementRef;

    @Input()
    set value(value: string) {
        if (value) {
            qrcode.toCanvas(this.qrCanvas.nativeElement, value, { errorCorrectionLevel: 'high' });
            this.qrCanvas.nativeElement.style.width = this.qrCanvas.nativeElement.parentNode.style.width;
            this.qrCanvas.nativeElement.style.height = this.qrCanvas.nativeElement.parentNode.style.height;
        }
    }

}
