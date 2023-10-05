import { Pipe, PipeTransform } from '@angular/core';
import { Big } from 'big.js';
import { ConversionService } from './conversion.service';

@Pipe({
    name: 'btc'
})
export class BtcPipe implements PipeTransform {

    constructor(private conversionService: ConversionService) { }

    transform(satoshis: Big | number): string {
        if (!satoshis) {
            return '0';
        }
        let text: string;
        if (satoshis instanceof Big) {
            const big = this.conversionService.bigSatoshiToBitcoinBig(satoshis);
            text = parseFloat(big.valueOf()).toFixed(8);
        } else {
            const number = this.conversionService.satoshiToBitcoin(satoshis as number);
            text = number.toFixed(8);
        }
        return this.removeTailingZeros(text);
    }

    removeTailingZeros(text: string) {
        while (text.endsWith('0')) {
            text = text.substring(0, text.length - 1);
        }
        if (text.endsWith('.')) {
            text = text.substring(0, text.length - 1);
        }
        return text;
    }

}
