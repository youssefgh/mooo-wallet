import { Injectable } from '@angular/core';
import { Big } from 'big.js';

@Injectable({
    providedIn: 'root'
})
export class ConversionService {

    satoshiInBitcoin = 100000000

    constructor() { }

    satoshiToBitcoinBig(satoshi: number): Big {
        return this.bigSatoshiToBitcoinBig(new Big(satoshi))
    }

    satoshiToBitcoin(satoshi: number): number {
        const big = this.satoshiToBitcoinBig(satoshi)
        return this.bigToNumber(big)
    }

    bigSatoshiToBitcoinBig(satoshi: Big): Big {
        return satoshi.div(this.satoshiInBitcoin)
    }

    bitcoinToSatoshiBig(bitcoin: number): Big {
        return new Big(bitcoin).times(this.satoshiInBitcoin)
    }

    bitcoinToSatoshi(bitcoin: number): number {
        const big = this.bitcoinToSatoshiBig(bitcoin)
        return this.bigToNumber(big)
    }

    bigToNumber(big: Big): number {
        return parseFloat(big.valueOf())
    }

}
