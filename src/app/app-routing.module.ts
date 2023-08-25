import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AboutComponent } from './about/about.component';
import { BalanceComponent } from './balance/balance.component';
import { BroadcastComponent } from './broadcast/broadcast.component';
import { CreateTransactionComponent } from './create-transaction/create-transaction.component';
import { CreateWalletComponent } from './create-wallet/create-wallet.component';
import { DescriptorDerivationComponent } from './descriptor-derivation/descriptor-derivation.component';
import { MnemonicDerivationComponent } from './mnemonic-derivation/mnemonic-derivation.component';
import { MultisigDerivationComponent } from './multisig-derivation/multisig-derivation.component';
import { SettingsComponent } from './settings/settings.component';
import { SignComponent } from './sign/sign.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: '/create-wallet',
        pathMatch: 'full'
    },
    {
        path: 'create-wallet',
        component: CreateWalletComponent
    },
    {
        path: 'balance',
        component: BalanceComponent
    },
    {
        path: 'create-transaction',
        component: CreateTransactionComponent
    },
    {
        path: 'sign',
        component: SignComponent
    },
    {
        path: 'broadcast',
        component: BroadcastComponent
    },
    {
        path: 'descriptor-derivation',
        component: DescriptorDerivationComponent
    },
    {
        path: 'multisig-derivation',
        component: MultisigDerivationComponent
    },
    {
        path: 'mnemonic-derivation',
        component: MnemonicDerivationComponent
    },
    {
        path: 'settings',
        component: SettingsComponent
    },
    {
        path: 'about',
        component: AboutComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {})],
    exports: [RouterModule]
})
export class AppRoutingModule { }
