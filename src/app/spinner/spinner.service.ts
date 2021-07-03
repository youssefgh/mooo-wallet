import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SpinnerService {

    enabled = false;

    hide() {
        this.enabled = false;
    }

    show() {
        this.enabled = true;
    }

}
