// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
import {networks} from 'bitcoinjs-lib';

export const environment = {
    production: true,
    testnet: false,
    network: networks.bitcoin,
    electrumServer : '172.17.0.1',
    electrumPort : 50001,
    electrumProtocol : '1.4',
    proxyAddress : 'https://proxy.wallet.mooo.tech:8443',
    bitcoinfeesAddress: 'https://fee.wallet.mooo.tech:8443/api/v1/fees/list',
    btc: 'BTC',
    satoshi: 'Satoshi'
};
