import * as base from 'base-x';

const base43Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$*+-./:';

export class Base43 {

    static decode(text: string) {
        const base43Decoder = base(base43Chars);
        return base43Decoder.decode(text);
    }

    static encode(hex: string) {
        const base16Chars = '0123456789ABCDEF';
        const base16 = base(base16Chars);
        return base16.encode(Buffer.from(hex, 'hex'));
    }

}
