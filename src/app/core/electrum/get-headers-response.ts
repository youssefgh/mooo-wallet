
export class GetHeadersResponse {

    height: number;
    hex: string;

    static fromJson(json) {
        const instance = new GetHeadersResponse();
        instance.height = json.height;
        instance.hex = json.hex;
        return instance;
    }

}
