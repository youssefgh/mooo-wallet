
export class GetHistoryResponseItem {

    height: number;
    transactionHash: string;

    static fromJson(json) {
        const instance = new GetHistoryResponseItem();
        instance.height = json.height;
        instance.transactionHash = json.tx_hash;
        return instance;
    }

}
