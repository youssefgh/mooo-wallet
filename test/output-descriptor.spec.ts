import * as bitcoinjs from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { OutputDescriptor } from '../src/app/core/output-descriptor';

describe('OutputDescriptor', () => {

  it(`should build from single sig descriptor`, () => {
    const text = "tr([93ba71a5/86'/1'/0']tpubDDD2oxu2ywVnQ8RQpKtAtmE2i9FWGKgQBhzMTQJBgMbTD8SAX2J2WAJdAFXeZPBZcm77QT12XhG7aMudJku8dhP2JXz5AjeE2uT9j8oMQ1K/<0;1>/*)";

    const instance = OutputDescriptor.from(text);

    expect(instance.script).toEqual('tr');
    expect(instance.key.fingerprint).toEqual('93ba71a5');
    expect(instance.key.derivation).toEqual("/86'/1'/0'");
    expect(instance.key.value).toEqual('tpubDDD2oxu2ywVnQ8RQpKtAtmE2i9FWGKgQBhzMTQJBgMbTD8SAX2J2WAJdAFXeZPBZcm77QT12XhG7aMudJku8dhP2JXz5AjeE2uT9j8oMQ1K');
    expect(instance.key.change).toEqual('<0;1>');
    expect(instance.toString()).toEqual(text);
  });

  it(`should build from bip48 multi sig descriptor`, () => {
    const text = "wsh(sortedmulti(2,[bdce89c0/48h/1h/2h/2h]tpubDENTejVfSMCs8AKRRWvJzFxY3X9FNuhQwXMYwb6rUfatqAju9J5s2WEKVbg4vJzfSce3W3dMu6VUgMkXBAC3Nsr4jGgWGEtYz47SsdzMvTJ/<0;1>/*,[bdce89c0/48h/1h/0h/2h]tpubDFCs5cUrySMKHvrXeT4CyWuJnyZhWSP5wTpqVmB2ScDUPLgp5qvZYFyDQFZ6iKinR3jHbSqyfGakbAYhkhQQLTriCES6eops1ixiGvGYH4A/<0;1>/*,[bdce89c0/48h/1h/1h/2h]tpubDE5tynx3WNxu4bwTedPK9NYFpb7aFEmoE6VidJYUa7fvbTWm1y47FXnNxD53th2iS2ySBJGC1ZLwcGmSDsY6ogT95NUYXNq6wJ1E7zX7rK6/<0;1>/*))#s4qsnsft";

    const instance = OutputDescriptor.from(text);

    expect(instance.script).toEqual('wsh');
    expect(instance.key).toEqual(undefined);
    expect(instance.threshold).toEqual(2);
    expect(instance.sortedmultiParamList.length).toEqual(3);
    expect(instance.sortedmultiParamList[0].fingerprint).toEqual('bdce89c0');
    expect(instance.sortedmultiParamList[0].derivation).toEqual("/48h/1h/2h/2h");
    expect(instance.sortedmultiParamList[0].value).toEqual('tpubDENTejVfSMCs8AKRRWvJzFxY3X9FNuhQwXMYwb6rUfatqAju9J5s2WEKVbg4vJzfSce3W3dMu6VUgMkXBAC3Nsr4jGgWGEtYz47SsdzMvTJ');
    expect(instance.sortedmultiParamList[0].change).toEqual('<0;1>');
    expect(instance.checksum).toEqual('s4qsnsft');
    expect(instance.toString()).toEqual(text);
  });

  it(`should build from taproot multi sig descriptor`, () => {
    const text = "tr([bdce89c0/86'/1'/0']tpubDCYdnHPRqKTgQRfBsTrEBrx38yT7ZFnHvsaWPSKLBzf7mbB3DudwPoqwyB4cRsEYN51YSzxyKWeTZrQekKiQhYzcQHHx2qW8YpCx4jxvz26/<0;1>/*,sortedmulti_a(2,[bdce89c0/48h/1h/2h/2h]tpubDENTejVfSMCs8AKRRWvJzFxY3X9FNuhQwXMYwb6rUfatqAju9J5s2WEKVbg4vJzfSce3W3dMu6VUgMkXBAC3Nsr4jGgWGEtYz47SsdzMvTJ/<0;1>/*,[bdce89c0/48h/1h/0h/2h]tpubDFCs5cUrySMKHvrXeT4CyWuJnyZhWSP5wTpqVmB2ScDUPLgp5qvZYFyDQFZ6iKinR3jHbSqyfGakbAYhkhQQLTriCES6eops1ixiGvGYH4A/<0;1>/*,[bdce89c0/48h/1h/1h/2h]tpubDE5tynx3WNxu4bwTedPK9NYFpb7aFEmoE6VidJYUa7fvbTWm1y47FXnNxD53th2iS2ySBJGC1ZLwcGmSDsY6ogT95NUYXNq6wJ1E7zX7rK6/<0;1>/*))#s4qsnsft";

    const instance = OutputDescriptor.from(text);

    expect(instance.script).toEqual('tr');
    expect(instance.key.fingerprint).toEqual('bdce89c0');
    expect(instance.key.derivation).toEqual("/86'/1'/0'");
    expect(instance.key.value).toEqual('tpubDCYdnHPRqKTgQRfBsTrEBrx38yT7ZFnHvsaWPSKLBzf7mbB3DudwPoqwyB4cRsEYN51YSzxyKWeTZrQekKiQhYzcQHHx2qW8YpCx4jxvz26');
    expect(instance.key.change).toEqual('<0;1>');
    expect(instance.threshold).toEqual(2);
    expect(instance.sortedmultiaParamList.length).toEqual(3);
    expect(instance.sortedmultiaParamList[0].fingerprint).toEqual('bdce89c0');
    expect(instance.sortedmultiaParamList[0].derivation).toEqual("/48h/1h/2h/2h");
    expect(instance.sortedmultiaParamList[0].value).toEqual('tpubDENTejVfSMCs8AKRRWvJzFxY3X9FNuhQwXMYwb6rUfatqAju9J5s2WEKVbg4vJzfSce3W3dMu6VUgMkXBAC3Nsr4jGgWGEtYz47SsdzMvTJ');
    expect(instance.sortedmultiaParamList[0].change).toEqual('<0;1>');
    expect(instance.checksum).toEqual('s4qsnsft');
    expect(instance.toString()).toEqual(text);
  });

  it(`should correctly derive from single sig descriptor`, () => {
    bitcoinjs.initEccLib(ecc);
    const outputDescriptor = OutputDescriptor.from("tr([93ba71a5/86'/1'/0']tpubDDD2oxu2ywVnQ8RQpKtAtmE2i9FWGKgQBhzMTQJBgMbTD8SAX2J2WAJdAFXeZPBZcm77QT12XhG7aMudJku8dhP2JXz5AjeE2uT9j8oMQ1K/<0;1>/*)");
    const network = bitcoinjs.networks.regtest;

    const result = outputDescriptor.derive(0, 0, 3, network);

    expect(result.length).toEqual(3);
    expect(result[0].address.value).toEqual('bcrt1phr7tvl2fyvshjkc59c5m5mrvzpgmkt9q0yaujewnnumunmc4g6aqj9kwke');
    expect(result[1].address.value).toEqual('bcrt1pv5gynchtsca9pcaxfh409qy3zz97x337h7uyugfh209q7jpal0qsc89v3r');
    expect(result[2].address.value).toEqual('bcrt1pydmjqsxwkqw9279zkgw9078fr0av8ks83zg9kjt7udau5dfu5w5sxj98f2');
  });

  it(`should correctly derive from taproot multi sig descriptor`, () => {
    bitcoinjs.initEccLib(ecc);
    const outputDescriptor = OutputDescriptor.from("tr([bdce89c0/86'/1'/0']tpubDCYdnHPRqKTgQRfBsTrEBrx38yT7ZFnHvsaWPSKLBzf7mbB3DudwPoqwyB4cRsEYN51YSzxyKWeTZrQekKiQhYzcQHHx2qW8YpCx4jxvz26/<0;1>/*,sortedmulti_a(2,[bdce89c0/48'/1'/0'/2']tpubDFCs5cUrySMKHvrXeT4CyWuJnyZhWSP5wTpqVmB2ScDUPLgp5qvZYFyDQFZ6iKinR3jHbSqyfGakbAYhkhQQLTriCES6eops1ixiGvGYH4A/<0;1>/*,[bdce89c0/48'/1'/1'/2']tpubDE5tynx3WNxu4bwTedPK9NYFpb7aFEmoE6VidJYUa7fvbTWm1y47FXnNxD53th2iS2ySBJGC1ZLwcGmSDsY6ogT95NUYXNq6wJ1E7zX7rK6/<0;1>/*,[bdce89c0/48'/1'/2'/2']tpubDENTejVfSMCs8AKRRWvJzFxY3X9FNuhQwXMYwb6rUfatqAju9J5s2WEKVbg4vJzfSce3W3dMu6VUgMkXBAC3Nsr4jGgWGEtYz47SsdzMvTJ/<0;1>/*))");
    const network = bitcoinjs.networks.regtest;

    const result = outputDescriptor.derive(0, 0, 3, network);

    expect(result.length).toEqual(3);
    expect(result[0].address.value).toEqual('bcrt1p3cg2zsxcfl74hf4e9myzzwyr2ufwvqe7ywdkjadczn0cmn47mceszm9qth');
    expect(result[1].address.value).toEqual('bcrt1psxu6xslp36j8neh7h3dmsx4mejmxr2srjft9zwrcw5ylum5zj3tqfm90vg');
    expect(result[2].address.value).toEqual('bcrt1pr4jw9x9n8e92vs2jge8s4muejh25m7ufewcxl765en40c50g9nfs7sqp24');
  });

});
