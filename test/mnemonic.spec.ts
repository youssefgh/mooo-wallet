import * as bitcoinjs from 'bitcoinjs-lib';
import { Mnemonic } from '../src/app/core/bitcoinjs/mnemonic';

describe('Mnemonic', () => {

  it(`should generate good passphrase`, () => {
    const instance = Mnemonic.new(256);
    expect(instance.phrase.split(' ').length).toEqual(24);
  });

  it(`should generate bip84 extendedPublicKey`, () => {
    const instance = new Mnemonic();
    instance.phrase = 'wool bullet crunch trend acoustic text swap flash video news bless second';
    const purpose = 84;
    const account = 0;
    const network = bitcoinjs.networks.testnet;

    const result = instance.extendedPublicKey(purpose, account, network);

    expect(result).toEqual('tpubDDt1vYc6mGg3RozXp5EXWEyb2GgUK1viLz8n95LdyaqydmYJqoitS6gA7fY5FHncQxPsYxHnJPzU2nJgdcnw7WPGg1K4W6Wc3pRTjX8Ad1e');
  });

  it(`should generate bip49 extendedPublicKey`, () => {
    const instance = new Mnemonic();
    instance.phrase = 'wool bullet crunch trend acoustic text swap flash video news bless second';
    const purpose = 49;
    const account = 0;
    const network = bitcoinjs.networks.testnet;

    const result = instance.extendedPublicKey(purpose, account, network);

    expect(result).toEqual('tpubDDJ3Nh1KazCBWbCyb9xRU63FBjdB7U31rHm48w5J7qXKqnwpRNgYPcJxw82Lni9qRuFCgbrKoK9K9uR1BK99iL5DETqLXTzoqK1W6D3c3p5');
  });

});
