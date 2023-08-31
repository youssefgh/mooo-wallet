import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';

declare const M: any;

@Component({
    selector: 'app-qr-code-reader',
    templateUrl: './qr-code-reader.component.html',
    styleUrls: ['./qr-code-reader.component.css']
})
export class QrCodeReaderComponent implements OnInit {

    @Output()
    scanned = new EventEmitter<string>();
    @Output()
    created = new EventEmitter<QrCodeReaderComponent>();
    @Output()
    error = new EventEmitter<string>();

    codeReader = new BrowserQRCodeReader();
    scannerControls: IScannerControls;

    videoInputDevices: MediaDeviceInfo[];

    selectedMediaDeviceInfo: MediaDeviceInfo;

    useVideo: boolean;

    @ViewChild('qrModal', { static: true })
    qrModalRef: ElementRef;

    qrModal;

    @ViewChild('fileInput', { static: true })
    fileInputRef: ElementRef;

    ngOnInit() {
        BrowserQRCodeReader.listVideoInputDevices()
            .then(videoInputDevices => {
                if (videoInputDevices.length > 0) {
                    this.useVideo = true;
                    this.videoInputDevices = videoInputDevices;
                }
            })
            .catch(err => {
                console.log(err);
                this.useVideo = false;
            });

        const elem = this.qrModalRef.nativeElement;
        this.qrModal = M.Modal.init(elem, {
            onCloseEnd: () => {
                this.selectedMediaDeviceInfo = null;
            }
        });
        this.created.emit(this);
    }

    decodeFromFile() {
        this.fileInputRef.nativeElement.click();
    }

    onPictureChange(event) {
        const fileList: FileList = event.target.files;
        if (fileList && fileList.length > 0) {
            const file = fileList[0];
            const imgSrc = URL.createObjectURL(file);
            this.codeReader.decodeFromImageUrl(imgSrc).then(result => {
                this.scanned.emit(result.getText());
            }).catch(err => {
                console.error(err);
                this.error.emit(err);
            });
        }
    }

    decodeFromVideo() {
        this.qrModal.open();
    }

    async decodeFromVideoDevice(deviceInfo: MediaDeviceInfo) {
        this.selectedMediaDeviceInfo = deviceInfo;
        await this.codeReader
            .decodeFromVideoDevice(deviceInfo.deviceId, 'video',
                (result, error, scannerControls) => {
                    this.scannerControls = scannerControls;
                    if (result) {
                        this.scanned.emit(result.getText());
                    }
                })
            .catch(err => {
                console.error(err);
                this.error.emit(err);
            });
    }

    stopDecodeFromVideoDevice() {
        this.scannerControls?.stop();
        this.qrModal.close();
    }

}
