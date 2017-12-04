import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

import {EnvironementService} from './environement.service';

import {AppComponent} from './app.component';
import {CreateWalletComponent} from './create-wallet/create-wallet.component';
import {CreateTransactionComponent} from './create-transaction/create-transaction.component';
import {SignTransactionComponent} from './sign-transaction/sign-transaction.component';
import {BroadcastTransactionComponent} from './broadcast-transaction/broadcast-transaction.component';
import {PreviewTransactionComponent} from './preview-transaction/preview-transaction.component';
import {BalanceComponent} from './balance/balance.component';
import {SideNavigationComponent} from './side-navigation/side-navigation.component';
import {NavigationBarComponent} from './navigation-bar/navigation-bar.component';

@NgModule({
    declarations: [
        AppComponent,
        CreateWalletComponent,
        CreateTransactionComponent,
        SignTransactionComponent,
        BroadcastTransactionComponent,
        PreviewTransactionComponent,
        BalanceComponent,
        SideNavigationComponent,
        NavigationBarComponent
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
                path: 'CreateTransaction',
                component: CreateTransactionComponent
            },
            {
                path: 'SignTransaction',
                component: SignTransactionComponent
            },
            {
                path: 'BroadcastTransaction',
                component: BroadcastTransactionComponent
            }
        ])
    ],
    providers: [EnvironementService],
    bootstrap: [AppComponent]
})
export class AppModule {}
