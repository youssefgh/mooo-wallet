import {Big} from 'big.js';
const NUMBER_OF_SATOCHI_PER_BITCOIN: number = 100000000;

export class Output {

    constructor(public destination: string, public amount: Big) {
    }

    amountInSatochi(): number {
        return parseInt(this.amount.times(new Big(NUMBER_OF_SATOCHI_PER_BITCOIN)).valueOf());
    }

}