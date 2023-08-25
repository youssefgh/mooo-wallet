import { Derived } from '../src/app/core/bitcoinjs/derived';
import { OutputDescriptorKey } from '../src/app/core/output-descriptor-key';

describe('Derived', () => {

  it(`should return correct path`, () => {
    const outputDescriptorKey = OutputDescriptorKey.from("[93ba71a5/86'/1'/0']tpubDDD2oxu2ywVnQ8RQpKtAtmE2i9FWGKgQBhzMTQJBgMbTD8SAX2J2WAJdAFXeZPBZcm77QT12XhG7aMudJku8dhP2JXz5AjeE2uT9j8oMQ1K/<0;1>/*")
    const instance = new Derived();
    instance.change = 1;
    instance.index = 0;

    const path = instance.path(outputDescriptorKey);

    expect(path).toEqual("m/86'/1'/0'/1/0");
  });

});
