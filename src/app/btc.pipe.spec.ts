import { BtcPipe } from './btc.pipe';

describe('BtcPipe', () => {
  it('create an instance', () => {
    const pipe = new BtcPipe();
    expect(pipe).toBeTruthy();
  });
});
