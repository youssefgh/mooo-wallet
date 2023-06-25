import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Address } from '../core/bitcoinjs/address';
import { Network } from '../core/bitcoinjs/network';
import { Call } from '../core/electrum/call';
import { JsonRpcResponse } from '../core/electrum/json-rpc-response';
import { Procedure } from '../core/electrum/procedure';

@Injectable({
    providedIn: 'root'
})
export class BalanceService {

    constructor(private httpClient: HttpClient) { }

    loadBalanceFrom(addressList: Array<Address>,
        electrumProtocol: string,
        proxyAddress: string, network: Network) {
        const call = new Call();
        let procedure = new Procedure(1, 'server.version');
        procedure.params.push(electrumProtocol);
        procedure.params.push(electrumProtocol);
        call.procedureList.push(procedure.toString());
        let i = 2;
        addressList.forEach(address => {
            procedure = new Procedure(i++, 'blockchain.scripthash.get_balance');
            procedure.params.push(address.scriptHash(network));
            call.procedureList.push(procedure.toString());
        });
        return this.httpClient.post<Array<string>>(proxyAddress + '/proxy', call)
            .pipe(map(data => JsonRpcResponse.listFrom(data)))
            .toPromise();
    }

    loadHistoryFrom(addressList: Array<Address>,
        electrumProtocol: string,
        proxyAddress: string, network: Network) {
        const call = new Call();
        let procedure = new Procedure(1, 'server.version');
        procedure.params.push(electrumProtocol);
        procedure.params.push(electrumProtocol);
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(2, 'blockchain.headers.subscribe');
        call.procedureList.push(procedure.toString());
        let i = 3;
        addressList.forEach(address => {
            procedure = new Procedure(i++, 'blockchain.scripthash.get_history');
            procedure.params.push(address.scriptHash(network));
            call.procedureList.push(procedure.toString());
        });
        return this.httpClient.post<Array<string>>(proxyAddress + '/proxy', call)
            .pipe(map(data => JsonRpcResponse.listFrom(data)))
            .toPromise();
    }

}
