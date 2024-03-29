import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {

    settings: Settings;

    constructor() {
        this.init();
    }

    init() {
        const settingsJson = window.localStorage.getItem('settings');
        if (settingsJson) {
            this.settings = Object.assign(new Settings(), JSON.parse(settingsJson));
        } else {
            this.settings = new Settings();
        }
    }

    saveSettings() {
        window.localStorage.setItem('settings', JSON.stringify(this.settings));
    }

}

class Settings {

    gapLimit = 20;

}