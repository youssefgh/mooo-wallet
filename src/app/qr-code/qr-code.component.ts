import { Component, Input } from '@angular/core';
import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import { Subscription, interval } from 'rxjs';

@Component({
    selector: 'app-qr-code',
    templateUrl: './qr-code.component.html',
    styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent {

    currentImage: string;
    imageList: string[];
    writer = new BrowserQRCodeSvgWriter();

    intervall = interval(500);
    subscription: Subscription;
    currentImageIndex: number;

    @Input()
    set value(list: string[]) {
        this.currentImage = null;
        this.currentImageIndex = 0;
        this.subscription?.unsubscribe();
        if (!list || list.length === 0) {
            return;
        }
        this.imageList = list.map(qrItem => this.svgFrom(qrItem));
        if (this.imageList.length === 1) {
            this.currentImage = this.imageList[0];
        } else {
            this.subscription = this.intervall.subscribe(() => {
                if (this.currentImageIndex >= this.imageList.length) {
                    this.currentImageIndex = 0;
                }
                this.currentImage = this.imageList[this.currentImageIndex];
                this.currentImageIndex++;
            });
        }
    }

    svgFrom(qrItem: string) {
        const svg = this.writer.write(qrItem, 400, 400);
        const svgAsXML = (new XMLSerializer).serializeToString(svg);
        return 'data:image/svg+xml,' + encodeURIComponent(svgAsXML);
    }

}
