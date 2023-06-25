import { GetBalanceResponse } from "./get-balance-response";
import { GetHeadersResponse } from "./get-headers-response";
import { GetHistoryResponseItem } from "./get-history-response-item";

export class JsonRpcResponse {

    id: string;
    result: any;
    error: JsonRpcResponseError;

    static from(response: string) {
        const jsonResponse = JSON.parse(response);
        const jsonRpcResponse = new JsonRpcResponse();
        jsonRpcResponse.id = jsonResponse.id;
        jsonRpcResponse.result = jsonResponse.result;
        jsonRpcResponse.error = jsonResponse.error;
        if (jsonRpcResponse.error) {
            throw new Error(jsonRpcResponse.error.message);
        }
        return jsonRpcResponse;
    }

    static listFrom(stringResponseList: Array<string>) {
        let responseList = new Array<JsonRpcResponse>();
        for (const responseString of stringResponseList) {
            const response = JsonRpcResponse.from(responseString);
            responseList.push(response);
        }
        return responseList.sort((a, b) => a.id > b.id ? 1 : -1);
    }

    toGetBalanceResponse() {
        return GetBalanceResponse.fromJson(this.result);
    }

    toHeadersResponse() {
        return GetHeadersResponse.fromJson(this.result);
    }

    toGetHistoryResponse() {
        return (this.result as Array<GetHistoryResponseItem>).map(item => GetHistoryResponseItem.fromJson(item));
    }

}

export class JsonRpcResponseError {

    message: string;
    code: string;

}
