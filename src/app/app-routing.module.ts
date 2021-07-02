import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CreateWalletComponent } from './create-wallet/create-wallet.component';
import { BalanceComponent } from './balance/balance.component';
import { SendComponent } from './send/send.component';
import { AboutComponent } from './about/about.component';
import { MnemonicDerivationComponent } from './mnemonic-derivation/mnemonic-derivation.component';
import { ExtendedKeyDerivationComponent } from './extended-key-derivation/extended-key-derivation.component';

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
        path: 'Send',
        component: SendComponent
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
        path: 'About',
        component: AboutComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
