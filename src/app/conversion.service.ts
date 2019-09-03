import { Injectable } from '@angular/core';
import { Big } from 'big.js';

@Injectable({
    providedIn: 'root'
})
export class ConversionService {

    constructor() { }

    satoshiToBitcoin(satoshi: number): Big {
        return new Big(satoshi).times(new Big(0.00000001))
    }

    bigSatoshiToBitcoin(satoshi: Big): Big {
        return satoshi.times(new Big(0.00000001))
    }

}
