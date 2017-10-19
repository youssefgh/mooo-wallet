
export class Output {

    destination: Buffer;

    constructor(destination: string,public amount: number) {
        this.destination = new Buffer(destination);
    }

}