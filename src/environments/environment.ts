// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
import {networks} from 'bitcoinjs-lib';

export const environment = {
    production: false,
    testnet: true,
    network: networks.testnet,
    electrumServer : 'testnet.hsmiths.com',
    electrumPort : 53011,
    electrumProtocol : '1.2',
    proxyAddress : 'http://localhost:8100',
    bitcoinfeesAddress: 'http://localhost:8081/api/v1/fees/list',
    btc: 'tBTC',
    satoshi: 'tSatoshi'
};
