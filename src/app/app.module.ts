import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

import {SendService} from './send.service';
import {WalletGenerationService} from './wallet-generation.service';

import {AppComponent} from './app.component';
import {CreateWalletComponent} from './create-wallet/create-wallet.component';
import {BalanceComponent} from './balance/balance.component';
import {SideNavigationComponent} from './side-navigation/side-navigation.component';
import {NavigationBarComponent} from './navigation-bar/navigation-bar.component';
import {SendComponent} from './send/send.component';
import {AboutComponent} from './about/about.component';

@NgModule({
    declarations: [
        AppComponent,
        CreateWalletComponent,
        BalanceComponent,
        SideNavigationComponent,
        NavigationBarComponent,
        SendComponent,
        AboutComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        RouterModule.forRoot([
            {
                path: '',
                redirectTo: '/CreateWallet',
                pathMatch: 'full'
            },
            {
                path: 'CreateWallet',
                component: CreateWalletComponent
            },
            {
                path: 'Balance',
                component: BalanceComponent
            },
            {
                path: 'Send',
                component: SendComponent
            },
            {
                path: 'About',
                component: AboutComponent
            }
        ])
    ],
    providers: [SendService, WalletGenerationService],
    bootstrap: [AppComponent]
})
export class AppModule {}
