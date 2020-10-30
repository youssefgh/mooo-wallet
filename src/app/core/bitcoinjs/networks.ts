import * as bitcoinjs from 'bitcoinjs-lib';

// export class Networks {

//     value: string;

//     scriptHash(network: bitcoinjs.Network) {
//         const outputScript = bitcoinjs.address.toOutputScript(this.value, network);
//         const reversedScriptHash = new Buffer(bitcoinjs.crypto.sha256(outputScript).reverse());
//         return reversedScriptHash.toString('hex');
//     }

//     toString() {
//         return this.value;
//     }

// }
