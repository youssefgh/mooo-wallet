
export class Procedure {

    params: string[] = new Array();

    constructor(public id: number, public method: string) {}

    toString() {
        return JSON.stringify(this);
    }

}