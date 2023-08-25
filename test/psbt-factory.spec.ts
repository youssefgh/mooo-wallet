import * as bitcoinjs from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { Derivator } from '../src/app/core/bitcoinjs/derivator';
import { Output } from '../src/app/core/bitcoinjs/output';
import { PsbtFactory } from '../src/app/core/bitcoinjs/psbt-factory';
import { Utxo } from '../src/app/core/bitcoinjs/utxo';
import { OutputDescriptor } from '../src/app/core/output-descriptor';

describe('PsbtFactory', () => {

  it(`should build complete for bip48`, () => {
    bitcoinjs.initEccLib(ecc);
    const outputDescriptorString = "wsh(sortedmulti(2,[bdce89c0/48h/1h/2h/2h]tpubDENTejVfSMCs8AKRRWvJzFxY3X9FNuhQwXMYwb6rUfatqAju9J5s2WEKVbg4vJzfSce3W3dMu6VUgMkXBAC3Nsr4jGgWGEtYz47SsdzMvTJ/<0;1>/*,[bdce89c0/48h/1h/0h/2h]tpubDFCs5cUrySMKHvrXeT4CyWuJnyZhWSP5wTpqVmB2ScDUPLgp5qvZYFyDQFZ6iKinR3jHbSqyfGakbAYhkhQQLTriCES6eops1ixiGvGYH4A/<0;1>/*,[bdce89c0/48h/1h/1h/2h]tpubDE5tynx3WNxu4bwTedPK9NYFpb7aFEmoE6VidJYUa7fvbTWm1y47FXnNxD53th2iS2ySBJGC1ZLwcGmSDsY6ogT95NUYXNq6wJ1E7zX7rK6/<0;1>/*))#s4qsnsft";
    const network = bitcoinjs.networks.testnet;
    const outputArray: Output[] = [
      {
        destination: "tb1p8k5nruf5ecn30lecfzxqc893unvqxc4gy7y25mtqyk4f2rf5hj6qls4ve2",
        amount: 5000
      }
    ];
    const changeOutputDerived = Derivator.deriveMultisigList(OutputDescriptor.from(outputDescriptorString), 1, 1, 2, network)[0];
    const changeOutput: Output = {
      amount: 104626,
      destination: 'tb1q6c6hm2kglv4s3fsz6w4nx7k8yrr89a9djnlkl0rl0uwyxrj7y5pqf2924l',
      derived: changeOutputDerived,
    };
    const utxo1Derived = Derivator.deriveMultisigList(OutputDescriptor.from(outputDescriptorString), 0, 1, 2, network)[0];
    const utxo2Derived = Derivator.deriveMultisigList(OutputDescriptor.from(outputDescriptorString), 0, 2, 3, network)[0];
    const utxoArray: Utxo[] = [
      {
        derived: utxo1Derived,
        satoshis: 10000,
        transaction: {
          id: "cb347fa5864c53f607cb9d97b095b098164184007c332c00edb8cfb14e4b679a",
          height: 2471399,
          confirmations: 3388
        },
        transactionHex: "02000000000101d0c23baa4fc51149fb6e01982ae748d533864fc7d4e600b73a9748927c371eec0100000000ac0300000249690400000000002251207393c0171ab84fe78676e24c42d987c7c996e9e878156d7b5f34a1534a457750102700000000000022002028a77d0453fd48cb214f24901f4098ea08a50bb31c3899c674c50b902135a7e90140f4bec0e94c7e284f5afda9e82c93e9c364eea267615f22b9dc6920b7b1f9b69ce25545916d91d2100f3096a2f0666db1dddf0cf7b28ea4845fa7b00c7beec51f00000000",
        vout: 1,
      },
      {
        derived: utxo2Derived,
        satoshis: 100000,
        transaction: {
          id: "31315f07bc3f7b8f9b8fc0dcbe6dbc1de5d4ec55be9b722d52494b7f4edbb28c",
          height: 2474124,
          confirmations: 665
        },
        transactionHex: "02000000000101b7ed4da538a226c3fe45b852ea86e9574f0e7f8001d7717ebd4e471b35227f3a0100000000ffffffff02a086010000000000220020348c82ee3d29d488e57d52bf1d097ce80f1236a1e088e301459d143e56d3a22d6f468300000000001600147ca307f33d41cd552ab6e7285519505d7877976702483045022100c55dcebc9cb9c2ba1efe51a9e50bd0de5084997ce2ab0f22ca4179917fb02de402206f847c0d5d39448ecba20c5745cc9246588098451c621ca65104d2d78a5f0bd801210348040e9c26022962ecf6867ec9cfa1e7803ac1e8f4449f759c95391c0b91015d00000000",
        vout: 0,
      },
    ];

    const psbt = PsbtFactory.create(outputDescriptorString, outputArray, changeOutput, utxoArray, network);

    expect(psbt.object.data.inputs.length).toEqual(2);
    expect(psbt.object.data.outputs.length).toEqual(2);
    expect(psbt.object.data.inputs[0].witnessScript).toBeDefined();
    expect(psbt.object.data.inputs[1].witnessScript).toBeDefined();
  });


  it(`should build complete for bip84`, () => {
    bitcoinjs.initEccLib(ecc);
    const outputDescriptorString = "wpkh([bdce89c0/84'/1'/0']tpubD6NzVbkrYhZ4WSYxR6FY3XY6soqxb8wteEXiaACpFpHZmujwD1WD7U2GnExnKga4HTut7onqa746gcbDhYMVNyqfr9H4JDiC5tWpWZFDdwt/<0;1>/*)";
    const network = bitcoinjs.networks.testnet;
    const outputArray: Output[] = [
      {
        destination: "tb1p8k5nruf5ecn30lecfzxqc893unvqxc4gy7y25mtqyk4f2rf5hj6qls4ve2",
        amount: 5000
      }
    ];
    const changeOutputDerived = Derivator.derive(outputDescriptorString, 1, 1, 2, network)[0];
    const changeOutput: Output = {
      amount: 104626,
      destination: 'tb1q6c6hm2kglv4s3fsz6w4nx7k8yrr89a9djnlkl0rl0uwyxrj7y5pqf2924l',
      derived: changeOutputDerived,
    };
    const utxo1Derived = Derivator.derive(outputDescriptorString, 0, 1, 2, network)[0];
    const utxo2Derived = Derivator.derive(outputDescriptorString, 0, 2, 3, network)[0];
    const utxoArray: Utxo[] = [
      {
        derived: utxo1Derived,
        satoshis: 10000,
        transaction: {
          id: "cb347fa5864c53f607cb9d97b095b098164184007c332c00edb8cfb14e4b679a",
          height: 2471399,
          confirmations: 3388
        },
        transactionHex: "02000000000101d0c23baa4fc51149fb6e01982ae748d533864fc7d4e600b73a9748927c371eec0100000000ac0300000249690400000000002251207393c0171ab84fe78676e24c42d987c7c996e9e878156d7b5f34a1534a457750102700000000000022002028a77d0453fd48cb214f24901f4098ea08a50bb31c3899c674c50b902135a7e90140f4bec0e94c7e284f5afda9e82c93e9c364eea267615f22b9dc6920b7b1f9b69ce25545916d91d2100f3096a2f0666db1dddf0cf7b28ea4845fa7b00c7beec51f00000000",
        vout: 1,
      },
      {
        derived: utxo2Derived,
        satoshis: 100000,
        transaction: {
          id: "31315f07bc3f7b8f9b8fc0dcbe6dbc1de5d4ec55be9b722d52494b7f4edbb28c",
          height: 2474124,
          confirmations: 665
        },
        transactionHex: "02000000000101b7ed4da538a226c3fe45b852ea86e9574f0e7f8001d7717ebd4e471b35227f3a0100000000ffffffff02a086010000000000220020348c82ee3d29d488e57d52bf1d097ce80f1236a1e088e301459d143e56d3a22d6f468300000000001600147ca307f33d41cd552ab6e7285519505d7877976702483045022100c55dcebc9cb9c2ba1efe51a9e50bd0de5084997ce2ab0f22ca4179917fb02de402206f847c0d5d39448ecba20c5745cc9246588098451c621ca65104d2d78a5f0bd801210348040e9c26022962ecf6867ec9cfa1e7803ac1e8f4449f759c95391c0b91015d00000000",
        vout: 0,
      },
    ];

    const psbt = PsbtFactory.create(outputDescriptorString, outputArray, changeOutput, utxoArray, network);

    expect(psbt.object.data.inputs.length).toEqual(2);
    expect(psbt.object.data.outputs.length).toEqual(2);
  });


  it(`should build complete for bip86`, () => {
    bitcoinjs.initEccLib(ecc);
    const outputDescriptorString = "tr([bdce89c0/86h/1h/0h]tpubDCYdnHPRqKTgQRfBsTrEBrx38yT7ZFnHvsaWPSKLBzf7mbB3DudwPoqwyB4cRsEYN51YSzxyKWeTZrQekKiQhYzcQHHx2qW8YpCx4jxvz26/<0;1>/*)#9e0gukal";
    const network = bitcoinjs.networks.testnet;
    const outputArray: Output[] = [
      {
        destination: "tb1p8k5nruf5ecn30lecfzxqc893unvqxc4gy7y25mtqyk4f2rf5hj6qls4ve2",
        amount: 5000
      }
    ];
    const changeOutputDerived = Derivator.derive(outputDescriptorString, 1, 1, 2, network)[0];
    const changeOutput: Output = {
      amount: 104626,
      destination: 'tb1q6c6hm2kglv4s3fsz6w4nx7k8yrr89a9djnlkl0rl0uwyxrj7y5pqf2924l',
      derived: changeOutputDerived,
    };
    const utxo1Derived = Derivator.derive(outputDescriptorString, 0, 1, 2, network)[0];
    const utxo2Derived = Derivator.derive(outputDescriptorString, 0, 2, 3, network)[0];
    const utxoArray: Utxo[] = [
      {
        derived: utxo1Derived,
        satoshis: 10000,
        transaction: {
          id: "cb347fa5864c53f607cb9d97b095b098164184007c332c00edb8cfb14e4b679a",
          height: 2471399,
          confirmations: 3388
        },
        transactionHex: "02000000000101d0c23baa4fc51149fb6e01982ae748d533864fc7d4e600b73a9748927c371eec0100000000ac0300000249690400000000002251207393c0171ab84fe78676e24c42d987c7c996e9e878156d7b5f34a1534a457750102700000000000022002028a77d0453fd48cb214f24901f4098ea08a50bb31c3899c674c50b902135a7e90140f4bec0e94c7e284f5afda9e82c93e9c364eea267615f22b9dc6920b7b1f9b69ce25545916d91d2100f3096a2f0666db1dddf0cf7b28ea4845fa7b00c7beec51f00000000",
        vout: 1,
      },
      {
        derived: utxo2Derived,
        satoshis: 100000,
        transaction: {
          id: "31315f07bc3f7b8f9b8fc0dcbe6dbc1de5d4ec55be9b722d52494b7f4edbb28c",
          height: 2474124,
          confirmations: 665
        },
        transactionHex: "02000000000101b7ed4da538a226c3fe45b852ea86e9574f0e7f8001d7717ebd4e471b35227f3a0100000000ffffffff02a086010000000000220020348c82ee3d29d488e57d52bf1d097ce80f1236a1e088e301459d143e56d3a22d6f468300000000001600147ca307f33d41cd552ab6e7285519505d7877976702483045022100c55dcebc9cb9c2ba1efe51a9e50bd0de5084997ce2ab0f22ca4179917fb02de402206f847c0d5d39448ecba20c5745cc9246588098451c621ca65104d2d78a5f0bd801210348040e9c26022962ecf6867ec9cfa1e7803ac1e8f4449f759c95391c0b91015d00000000",
        vout: 0,
      },
    ];

    const psbt = PsbtFactory.create(outputDescriptorString, outputArray, changeOutput, utxoArray, network);

    expect(psbt.object.data.inputs.length).toEqual(2);
    expect(psbt.object.data.outputs.length).toEqual(2);
  });

});
