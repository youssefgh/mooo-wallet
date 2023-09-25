import * as bitcoinjs from 'bitcoinjs-lib';
import { Mnemonic } from '../src/app/core/bitcoinjs/mnemonic';
import { PsbtTransactionDetails } from '../src/app/core/psbt-transaction-details';

describe('PsbtTransactionDetails', () => {

  it(`from should return all`, () => {
    const network = bitcoinjs.networks.regtest;
    const psbt = new bitcoinjs.Psbt({ network });
    psbt.addOutput({
      address: 'bcrt1q0hgwev7rjf7pw4zrykxuz0uux3dg9jcaw3rf70',
      value: 1000,
      bip32Derivation: [
        {
          masterFingerprint: Buffer.from('bdce89c0', 'hex'),
          path: "m/84'/1'/0'/1/0",
          pubkey: Buffer.from('03eebe8cfd178bd03168b426c9f98cf16e197f07ba40f64e772a50fd8cd61b708d', 'hex'),
        }
      ]
    })
    psbt.addOutput({
      address: 'bcrt1q5qc0hv23jymf7rklcxuv5a44g36ffldgem66yk',
      value: 1000,
    });

    const instance = PsbtTransactionDetails.from(psbt, network);

    expect(instance.walletDestinationList.length).toEqual(2);
  });

  it(`fromSigned should return correct`, () => {
    const network = bitcoinjs.networks.regtest;
    const mnemonic = new Mnemonic();
    mnemonic.phrase = 'wool bullet crunch trend acoustic text swap flash video news bless second';
    const psbt = new bitcoinjs.Psbt({ network });
    psbt.addOutput({
      address: 'bcrt1q0hgwev7rjf7pw4zrykxuz0uux3dg9jcaw3rf70',
      value: 1000,
      bip32Derivation: [
        {
          masterFingerprint: Buffer.from('bdce89c0', 'hex'),
          path: "m/84'/1'/0'/1/0",
          pubkey: Buffer.from('03eebe8cfd178bd03168b426c9f98cf16e197f07ba40f64e772a50fd8cd61b708d', 'hex'),
        }
      ]
    });
    psbt.addOutput({
      address: 'bcrt1q0hgwev7rjf7pw4zrykxuz0uux3dg9jcaw3rf70',
      value: 1000,
      bip32Derivation: [
        {
          masterFingerprint: Buffer.from('bdce89c0', 'hex'),
          path: "m/84'/1'/0'/1/100",
          pubkey: Buffer.from('03eebe8cfd178bd03168b426c9f98cf16e197f07ba40f64e772a50fd8cd61b708d', 'hex'),
        }
      ]
    });
    psbt.addOutput({
      address: 'bcrt1p26gc5gqplhrg72fu6d5nmqcy0z7n8xczj6am99jxfzumwaamt73sy86q54',
      value: 1000,
      tapBip32Derivation: [
        {
          masterFingerprint: Buffer.from('bdce89c0', 'hex'),
          path: "m/86'/1'/0'/1/0",
          pubkey: Buffer.from('3eebe8cfd178bd03168b426c9f98cf16e197f07ba40f64e772a50fd8cd61b708d', 'hex'),
          leafHashes: [],
        }
      ]
    });
    psbt.addOutput({
      address: 'bcrt1p26gc5gqplhrg72fu6d5nmqcy0z7n8xczj6am99jxfzumwaamt73sy86q54',
      value: 1000,
      tapBip32Derivation: [
        {
          masterFingerprint: Buffer.from('bdce89c0', 'hex'),
          path: "m/86'/1'/0'/1/100",
          pubkey: Buffer.from('3eebe8cfd178bd03168b426c9f98cf16e197f07ba40f64e772a50fd8cd61b708d', 'hex'),
          leafHashes: [],
        }
      ]
    });
    psbt.addOutput({
      address: 'bcrt1q5qc0hv23jymf7rklcxuv5a44g36ffldgem66yk',
      value: 1000,
    });
    psbt.addOutput({
      address: 'bcrt1q5qc0hv23jymf7rklcxuv5a44g36ffldgem66yk',
      value: 1000,
      bip32Derivation: [
        {
          masterFingerprint: Buffer.from('bdce89c0', 'hex'),
          path: "m/84'/1'/0'/1/0",
          pubkey: Buffer.from('03eebe8cfd178bd03168b426c9f98cf16e197f07ba40f64e772a50fd8cd61b708d', 'hex'),
        },
        {
          masterFingerprint: Buffer.from('bdce89c0', 'hex'),
          path: "m/84'/1'/0'/1/100",
          pubkey: Buffer.from('03eebe8cfd178bd03168b426c9f98cf16e197f07ba40f64e772a50fd8cd61b70ff', 'hex'),
        },
      ]
    });

    const instance = PsbtTransactionDetails.fromSigned(mnemonic, psbt, network);

    expect(instance.walletDestinationList[0].change).toEqual(true);
    expect(instance.walletDestinationList[1].change).toEqual(false);
    expect(instance.walletDestinationList[2].change).toEqual(true);
    expect(instance.walletDestinationList[3].change).toEqual(false);
    expect(instance.walletDestinationList[4].change).toEqual(false);
    expect(instance.walletDestinationList[5].change).toEqual(false);
  });

});