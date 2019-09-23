import { Pipe, PipeTransform } from '@angular/core';
import { Big } from 'big.js';
import { ConversionService } from './conversion.service';
import { number } from 'bitcoinjs-lib/types/script';

@Pipe({
    name: 'btc'
})
export class BtcPipe implements PipeTransform {

    constructor(private conversionService: ConversionService) { }

    transform(satoshis: Big | number): string {
        if (!satoshis)
            return '0'
        let string
        if (satoshis instanceof Big) {
            const big = this.conversionService.bigSatoshiToBitcoinBig(satoshis)
            string = parseFloat(big.valueOf()).toFixed(8)
        } else {
            const number = this.conversionService.satoshiToBitcoin(satoshis)
            string = number.toFixed(8)
        }
        return this.removeTailingZeros(string)
    }

    removeTailingZeros(text: string) {
        while (text[text.length - 1] === "0") {
            text = text.substring(0, text.length - 1)
        }
        if (text[text.length - 1] === ".") {
            text = text.substring(0, text.length - 1)
        }
        return text
    }

}
