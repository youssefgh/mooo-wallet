import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { AboutComponent } from './about/about.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BalanceComponent } from './balance/balance.component';
import { BroadcastComponent } from './broadcast/broadcast.component';
import { BtcPipe } from './btc.pipe';
import { CreateTransactionComponent } from './create-transaction/create-transaction.component';
import { CreateWalletComponent } from './create-wallet/create-wallet.component';
import { DescriptorDerivationComponent } from './descriptor-derivation/descriptor-derivation.component';
import { MnemonicDerivationComponent } from './mnemonic-derivation/mnemonic-derivation.component';
import { MultisigDerivationComponent } from './multisig-derivation/multisig-derivation.component';
import { NavigationBarComponent } from './navigation-bar/navigation-bar.component';
import { QrCodeReaderComponent } from './qr-code-reader/qr-code-reader.component';
import { QrCodeComponent } from './qr-code/qr-code.component';
import { SettingsComponent } from './settings/settings.component';
import { SideNavigationComponent } from './side-navigation/side-navigation.component';
import { SignComponent } from './sign/sign.component';
import { SpinnerInterceptor } from './spinner/spinner-interceptor';
import { SpinnerComponent } from './spinner/spinner.component';


@NgModule({
    declarations: [
        AppComponent,
        CreateWalletComponent,
        BalanceComponent,
        SideNavigationComponent,
        NavigationBarComponent,
        CreateTransactionComponent,
        AboutComponent,
        MnemonicDerivationComponent,
        DescriptorDerivationComponent,
        MultisigDerivationComponent,
        BtcPipe,
        QrCodeComponent,
        QrCodeReaderComponent,
        SpinnerComponent,
        SettingsComponent,
        SignComponent,
        BroadcastComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        AppRoutingModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: SpinnerInterceptor,
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
