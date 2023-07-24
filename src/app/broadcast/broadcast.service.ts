import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Call } from '../core/electrum/call';
import { Procedure } from '../core/electrum/procedure';

@Injectable({
    providedIn: 'root'
})
export class BroadcastService {

    constructor(
        private httpClient: HttpClient,
    ) { }

    broadcast(transaction: string, electrumProtocol: string,
        proxyAddress: string) {
        const call = new Call();
        call.procedureList.push(this.serverVersionProcedure(1, electrumProtocol).toString());
        let procedure = new Procedure(2, 'blockchain.transaction.broadcast');
        procedure.params.push(transaction);
        call.procedureList.push(procedure.toString());
        return this.httpClient.post<any[]>(proxyAddress + '/proxy', call).toPromise();
    }

    serverVersionProcedure(i: number, electrumProtocol: string) {
        const procedure = new Procedure(i, 'server.version');
        procedure.params.push(electrumProtocol);
        procedure.params.push(electrumProtocol);
        return procedure;
    }

}
