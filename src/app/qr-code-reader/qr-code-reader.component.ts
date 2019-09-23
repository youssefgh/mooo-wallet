import { Component, OnInit, EventEmitter, Output, ElementRef, ViewChild } from '@angular/core';
import { BrowserQRCodeReader } from '@zxing/library';

declare var M: any;

@Component({
    selector: 'qr-code-reader',
    templateUrl: './qr-code-reader.component.html',
    styleUrls: ['./qr-code-reader.component.css']
})
export class QrCodeReaderComponent implements OnInit {

    @Output()
    scanned = new EventEmitter<string>()

    @Output()
    error = new EventEmitter<string>()

    codeReader: BrowserQRCodeReader

    videoInputDevices: MediaDeviceInfo[]

    selectedMediaDeviceInfo: MediaDeviceInfo

    useVideo: boolean

    @ViewChild('qrModal', { static: true })
    qrModalRef: ElementRef

    qrModal

    @ViewChild('fileInput', { static: true })
    fileInputRef: ElementRef

    constructor() { }

    ngOnInit() {
        this.codeReader = new BrowserQRCodeReader()
        this.codeReader
            .listVideoInputDevices()
            .then(videoInputDevices => {
                if (videoInputDevices.length > 0) {
                    this.useVideo = true
                    this.videoInputDevices = videoInputDevices
                }
            })
            .catch(err => {
                console.log(err)
                this.useVideo = false
            })

        const elem = this.qrModalRef.nativeElement
        this.qrModal = M.Modal.init(elem, {
            onCloseEnd: () => {
                this.selectedMediaDeviceInfo = null
                this.codeReader.reset()
            }
        })
    }

    decodeFromFile() {
        this.fileInputRef.nativeElement.click()
    }

    onPictureChange(event) {
        let fileList: FileList = event.target.files
        if (fileList && fileList.length > 0) {
            let file = fileList[0]
            let imgSrc = URL.createObjectURL(file)
            this.codeReader.decodeFromImage(undefined, imgSrc).then(result => {
                this.scanned.emit(result.getText())
            }).catch(err => {
                console.error(err)
                this.error.emit(err)
            })
        }
    }

    decodeFromVideo() {
        this.qrModal.open()
    }

    decodeFromVideoDevice(deviceInfo: MediaDeviceInfo) {
        this.selectedMediaDeviceInfo = deviceInfo
        this.codeReader
            .decodeFromInputVideoDevice(deviceInfo.deviceId, 'video')
            .then(result => {
                this.scanned.emit(result.getText())
                this.stopDecodeFromVideoDevice()
            }).catch(err => {
                console.error(err)
                this.error.emit(err)
            })
    }

    stopDecodeFromVideoDevice() {
        this.selectedMediaDeviceInfo = null
        this.qrModal.close()
    }

}
