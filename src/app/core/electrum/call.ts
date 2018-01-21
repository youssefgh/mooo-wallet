import {Procedure} from './procedure';

export class Call {

    procedureList: string[] = new Array();

    constructor(public server: string, public port: number) {}

}