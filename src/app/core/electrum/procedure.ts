
export class Procedure {

    params = new Array();

    constructor(public id: number, public method: string) {}

    toString() {
        return JSON.stringify(this);
    }

}