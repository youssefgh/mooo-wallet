import { Bip21DecoderUtils } from '../src/app/core/bip21-decoder-utils';

describe('Bip21DecoderUtils', () => {

  it(`should return true when bip21`, () => {
    const text = 'bitcoin:175tWpb8K1S7NmH4Zx6rewF9WQrcZv245W?amount=50&label=Luke-Jr&message=Donation%20for%20project%20xyz';

    const result = Bip21DecoderUtils.isBip21(text);

    expect(result).toEqual(true);
  });

  it(`should return false when not bip21`, () => {
    const text = '175tWpb8K1S7NmH4Zx6rewF9WQrcZv245W';

    const result = Bip21DecoderUtils.isBip21(text);

    expect(result).toEqual(false);
  });

  it(`should decode when no params`, () => {
    const text = 'bitcoin:175tWpb8K1S7NmH4Zx6rewF9WQrcZv245W';

    const result = Bip21DecoderUtils.decode(text);

    expect(result.address).toEqual('175tWpb8K1S7NmH4Zx6rewF9WQrcZv245W');
    expect(result.amount).toEqual(undefined);
  });

  it(`should decode when params`, () => {
    const text = 'bitcoin:175tWpb8K1S7NmH4Zx6rewF9WQrcZv245W?amount=50.1&label=Luke-Jr&message=Donation%20for%20project%20xyz';

    const result = Bip21DecoderUtils.decode(text);

    expect(result.address).toEqual('175tWpb8K1S7NmH4Zx6rewF9WQrcZv245W');
    expect(result.amount).toEqual(50.1);
  });

});
