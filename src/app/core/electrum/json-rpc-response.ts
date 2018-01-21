
export class JsonRpcResponse {

    id: string;
    result: any;
    error: JsonRpcResponseError;

    static from(response: string) {
        let jsonResponse = JSON.parse(response);
        let jsonRpcResponse = new JsonRpcResponse();
        jsonRpcResponse.id = jsonResponse.id;
        jsonRpcResponse.result = jsonResponse.result;
        jsonRpcResponse.error = jsonResponse.error;
        return jsonRpcResponse;
    }

}

export class JsonRpcResponseError {

    message: string;
    code: string;

}