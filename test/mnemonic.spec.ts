import * as bitcoinjs from 'bitcoinjs-lib';
import { Mnemonic } from '../src/app/core/bitcoinjs/mnemonic';

describe('Mnemonic', () => {

  it(`should generate good passphrase`, () => {
    const instance = Mnemonic.new(256);
    expect(instance.phrase.split(' ').length).toEqual(24);
  });

  it(`should generate bip84 finalNode`, () => {
    const instance = new Mnemonic();
    instance.phrase = 'wool bullet crunch trend acoustic text swap flash video news bless second';
    const purpose = 84;
    const account = 0;
    const network = bitcoinjs.networks.testnet;

    const result = instance.finalNode(purpose, account, undefined, network);

    expect(result.neutered().toBase58()).toEqual('tpubDDt1vYc6mGg3RozXp5EXWEyb2GgUK1viLz8n95LdyaqydmYJqoitS6gA7fY5FHncQxPsYxHnJPzU2nJgdcnw7WPGg1K4W6Wc3pRTjX8Ad1e');
    expect(result.derive(0).derive(0).publicKey.toString('hex')).toEqual('020bf06da7279181123e7ea2c4db5d5810026bdc955051443915739f1bd06dd844');
  });

  it(`should generate bip48 finalNode`, () => {
    const instance = new Mnemonic();
    instance.phrase = 'wool bullet crunch trend acoustic text swap flash video news bless second';
    const purpose = 48;
    const account = 0;
    const script = 2;
    const network = bitcoinjs.networks.testnet;

    const result = instance.finalNode(purpose, account, script, network);

    expect(result.neutered().toBase58()).toEqual('tpubDFCs5cUrySMKHvrXeT4CyWuJnyZhWSP5wTpqVmB2ScDUPLgp5qvZYFyDQFZ6iKinR3jHbSqyfGakbAYhkhQQLTriCES6eops1ixiGvGYH4A');
    expect(result.derive(0).derive(0).publicKey.toString('hex')).toEqual('02d248d21d62ca17e0f434ced98f7dfa1a29bd34f9d83734ae3cd2a1e4beb2593a');
  });

  it(`should generate bip49 finalNode`, () => {
    const instance = new Mnemonic();
    instance.phrase = 'wool bullet crunch trend acoustic text swap flash video news bless second';
    const purpose = 49;
    const account = 0;
    const network = bitcoinjs.networks.testnet;

    const result = instance.finalNode(purpose, account, undefined, network);

    expect(result.neutered().toBase58()).toEqual('tpubDDJ3Nh1KazCBWbCyb9xRU63FBjdB7U31rHm48w5J7qXKqnwpRNgYPcJxw82Lni9qRuFCgbrKoK9K9uR1BK99iL5DETqLXTzoqK1W6D3c3p5');
    expect(result.derive(0).derive(0).publicKey.toString('hex')).toEqual('028e2bef18ac4f6b89ae7187f7e892f0de7596e3f274435b8581a166a5f495ad19');
  });

});
