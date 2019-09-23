import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { CreateWalletComponent } from './create-wallet/create-wallet.component';
import { BalanceComponent } from './balance/balance.component';
import { SideNavigationComponent } from './side-navigation/side-navigation.component';
import { NavigationBarComponent } from './navigation-bar/navigation-bar.component';
import { SendComponent } from './send/send.component';
import { AboutComponent } from './about/about.component';
import { MnemonicDerivationComponent } from './mnemonic-derivation/mnemonic-derivation.component';
import { ExtendedKeyDerivationComponent } from './extended-key-derivation/extended-key-derivation.component';
import { AppRoutingModule } from './app-routing.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { BtcPipe } from './btc.pipe';
import { QrCodeComponent } from './qr-code/qr-code.component';
import { QrCodeReaderComponent } from './qr-code-reader/qr-code-reader.component';

@NgModule({
    declarations: [
        AppComponent,
        CreateWalletComponent,
        BalanceComponent,
        SideNavigationComponent,
        NavigationBarComponent,
        SendComponent,
        AboutComponent,
        MnemonicDerivationComponent,
        ExtendedKeyDerivationComponent,
        BtcPipe,
        QrCodeComponent,
        QrCodeReaderComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        AppRoutingModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
