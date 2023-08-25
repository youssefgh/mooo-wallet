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
  });

});
