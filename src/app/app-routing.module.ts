import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AboutComponent } from './about/about.component';
import { BalanceComponent } from './balance/balance.component';
import { BroadcastComponent } from './broadcast/broadcast.component';
import { CreateTransactionComponent } from './create-transaction/create-transaction.component';
import { CreateWalletComponent } from './create-wallet/create-wallet.component';
import { ExtendedKeyDerivationComponent } from './extended-key-derivation/extended-key-derivation.component';
import { MnemonicDerivationComponent } from './mnemonic-derivation/mnemonic-derivation.component';
import { SettingsComponent } from './settings/settings.component';
import { SignComponent } from './sign/sign.component';

const routes: Routes = [
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
        path: 'Sign',
        component: SignComponent
    },
    {
        path: 'Broadcast',
        component: BroadcastComponent
    },
    {
        path: 'ExtendedKeyDerivation',
        component: ExtendedKeyDerivationComponent
    },
    {
        path: 'MnemonicDerivation',
        component: MnemonicDerivationComponent
    },
    {
        path: 'Settings',
        component: SettingsComponent
    },
    {
        path: 'About',
        component: AboutComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {})],
    exports: [RouterModule]
})
export class AppRoutingModule { }
