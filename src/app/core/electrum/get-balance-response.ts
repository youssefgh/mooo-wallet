import Big from 'big.js';

export class GetBalanceResponse {

    confirmed: Big;
    unconfirmed: Big;

    static fromJson(json) {
        const getBalanceResponse = new GetBalanceResponse();
        getBalanceResponse.confirmed = new Big(json.confirmed);
        getBalanceResponse.unconfirmed = new Big(json.unconfirmed);
        return getBalanceResponse;
    }

}
