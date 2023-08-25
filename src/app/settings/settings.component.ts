import { Component, Input } from '@angular/core';
import { environment } from '../../environments/environment';
import { LocalStorageService } from '../shared/local-storage.service';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {

    environment = environment;

    constructor(
        private localStorageService: LocalStorageService,
    ) {
    }

    // get bip44Enabled() {
    //     return this.localStorageService.settings.bip44Enabled;
    // }

    // @Input()
    // set bip44Enabled(bip44Enabled: boolean) {
    //     this.localStorageService.settings.bip44Enabled = bip44Enabled;
    //     this.localStorageService.saveSettings();
    // }

}
