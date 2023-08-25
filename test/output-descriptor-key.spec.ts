import * as bitcoinjs from 'bitcoinjs-lib';
import { OutputDescriptorKey } from '../src/app/core/output-descriptor-key';

describe('OutputDescriptorKey', () => {

  it(`should build`, () => {
    const text = "[93ba71a5/86'/1'/0']tpubDDD2oxu2ywVnQ8RQpKtAtmE2i9FWGKgQBhzMTQJBgMbTD8SAX2J2WAJdAFXeZPBZcm77QT12XhG7aMudJku8dhP2JXz5AjeE2uT9j8oMQ1K/<0;1>/*";

    const instance = OutputDescriptorKey.from(text);

    expect(instance.fingerprint).toEqual('93ba71a5');
    expect(instance.derivation).toEqual("/86'/1'/0'");
    expect(instance.value).toEqual('tpubDDD2oxu2ywVnQ8RQpKtAtmE2i9FWGKgQBhzMTQJBgMbTD8SAX2J2WAJdAFXeZPBZcm77QT12XhG7aMudJku8dhP2JXz5AjeE2uT9j8oMQ1K');
    expect(instance.change).toEqual('<0;1>');
  });

  it(`should build return correct derivationDetails for single sig`, () => {
    const text = "[93ba71a5/86'/1'/0']tpubDDD2oxu2ywVnQ8RQpKtAtmE2i9FWGKgQBhzMTQJBgMbTD8SAX2J2WAJdAFXeZPBZcm77QT12XhG7aMudJku8dhP2JXz5AjeE2uT9j8oMQ1K/<0;1>/*";
    const instance = OutputDescriptorKey.from(text);

    const result = instance.derivationDetails();

    expect(result.purpose).toEqual(86);
    expect(result.coinType).toEqual(1);
    expect(result.account).toEqual(0);
    expect(result.script).toEqual(undefined);
  });

  it(`should build return correct derivationDetails for multi sig`, () => {
    const text = "[bdce89c0/48h/1h/0h/2h]tpubDFCs5cUrySMKHvrXeT4CyWuJnyZhWSP5wTpqVmB2ScDUPLgp5qvZYFyDQFZ6iKinR3jHbSqyfGakbAYhkhQQLTriCES6eops1ixiGvGYH4A/<0;1>/*";
    const instance = OutputDescriptorKey.from(text);

    const result = instance.derivationDetails();

    expect(result.purpose).toEqual(48);
    expect(result.coinType).toEqual(1);
    expect(result.account).toEqual(0);
    expect(result.script).toEqual(2);
  });

  it(`should build return correct derivationDetails for single sig`, () => {
    const text = "[93ba71a5/86'/1'/0']tpubDDD2oxu2ywVnQ8RQpKtAtmE2i9FWGKgQBhzMTQJBgMbTD8SAX2J2WAJdAFXeZPBZcm77QT12XhG7aMudJku8dhP2JXz5AjeE2uT9j8oMQ1K/<0;1>/*";
    const change = 1;
    const index = 0;
    const network = bitcoinjs.networks.testnet;
    const instance = OutputDescriptorKey.from(text);

    const result = instance.publicKey(change, index, network);

    expect(result.toString('hex')).toEqual('03bf54bdb7222f6d4eaeccde7628aeb5c9fe796b3702e00ddd393c0a46e2555165');
  });

});
