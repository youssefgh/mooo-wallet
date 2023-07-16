import { Derived } from './derived';

export class Output {

    constructor(public destination: string, public amount: number, public derived?: Derived) {
    }

}