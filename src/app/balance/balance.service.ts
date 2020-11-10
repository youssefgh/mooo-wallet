import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Address } from '../core/bitcoinjs/address';
import { Network } from '../core/bitcoinjs/network';
import { Transaction } from '../core/bitcoinjs/transaction';
import { Derived } from '../core/derived';
import { Call } from '../core/electrum/call';
import { JsonRpcResponse } from '../core/electrum/json-rpc-response';
import { Procedure } from '../core/electrum/procedure';
import { WsTransaction } from '../core/electrum/wsTransaction';

@Injectable({
    providedIn: 'root'
})
export class BalanceService {

    constructor(private httpClient: HttpClient) { }

    loadBalanceFrom(addressList: Array<Address>, electrumServer: string, electrumPort: number, electrumProtocol: string,
        proxyAddress: string, network: Network) {
        const call = new Call(electrumServer, electrumPort);
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
        return this.httpClient.post<any[]>(proxyAddress + '/api/proxy', call).pipe(map(data => {
            let responseList = new Array<JsonRpcResponse>();
            for (const responseString of data) {
                const response = JsonRpcResponse.from(responseString);
                if (response.error) {
                    return throwError(response.error.message);
                }
                responseList.push(response);
            }
            responseList = responseList.sort((a, b) => a.id > b.id ? 1 : -1);
            return responseList;
        }));
    }

    loadHistoryFrom(derivedList: Array<Derived>, electrumServer: string, electrumPort: number, electrumProtocol: string,
        proxyAddress: string, network: Network) {
        const call = new Call(electrumServer, electrumPort);
        let procedure = new Procedure(1, 'server.version');
        procedure.params.push(electrumProtocol);
        procedure.params.push(electrumProtocol);
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(2, 'blockchain.headers.subscribe');
        call.procedureList.push(procedure.toString());
        let i = 3;
        derivedList.forEach(derived => {
            procedure = new Procedure(i++, 'blockchain.scripthash.get_history');
            procedure.params.push(derived.address.scriptHash(network));
            call.procedureList.push(procedure.toString());
        });
        return this.httpClient.post<any[]>(proxyAddress + '/api/proxy', call).pipe(map(data => {
            let responseList = new Array<JsonRpcResponse>();
            for (const responseString of data) {
                const response = JsonRpcResponse.from(responseString);
                if (response.error) {
                    return throwError(response.error.message);
                }
                responseList.push(response);
            }
            responseList = responseList.sort((a, b) => a.id > b.id ? 1 : -1);
            const lastBlockHeight: number = responseList[1].result.height;
            const transactionArrayArray = new Array<Array<WsTransaction>>();
            for (let index = 2; index < responseList.length; index++) {
                const response = responseList[index];
                const transactionArray = new Array<WsTransaction>();
                for (const item of response.result.reverse()) {
                    const transaction = new WsTransaction;
                    transaction.inCount = 0;
                    transaction.id = item.tx_hash;
                    transaction.satoshis = 0;
                    transaction.height = item.height;
                    if (transaction.height > 0) {
                        transaction.confirmations = lastBlockHeight - transaction.height + 1;
                    } else {
                        transaction.confirmations = 0;
                    }
                    transactionArray.push(transaction);
                }
                transactionArrayArray.push(transactionArray);
            }
            return transactionArrayArray;
        }));
    }

    rawTransactionOf(transactionIdList: string[], electrumServer: string, electrumPort: number, electrumProtocol: string,
        proxyAddress: string) {
        const call = new Call(electrumServer, electrumPort);
        let procedure = new Procedure(1, 'server.version');
        procedure.params.push(electrumProtocol);
        procedure.params.push(electrumProtocol);
        call.procedureList.push(procedure.toString());
        let i = 1;
        for (const id of transactionIdList) {
            procedure = new Procedure(++i, 'blockchain.transaction.get');
            procedure.params.push(id);
            call.procedureList.push(procedure.toString());
        }
        return this.httpClient.post<any[]>(proxyAddress + '/api/proxy', call);
    }

    transactionOf(derivedList: Array<Derived>, transactionArrayArray: Array<Array<WsTransaction>>,
        electrumServer: string, electrumPort: number, electrumProtocol: string,
        proxyAddress: string, network: Network) {
        return this.rawTransactionOf(this.transactionIdListOf(transactionArrayArray),
            electrumServer, electrumPort, electrumProtocol, proxyAddress).pipe(map(data => {
                data = data.map(d => JSON.parse(d)).sort((a, b) => a.id > b.id ? 1 : -1);
                for (let h = 0; h < transactionArrayArray.length; h++) {
                    const transactionArray = transactionArrayArray[h];
                    const address = derivedList[h].address;
                    for (let i = 0; i < transactionArray.length; i++) {
                        const transaction = transactionArray[i];
                        const transactionFromRaw = Transaction.fromHex(data[h + 1].result);
                        for (let j = 0; j < transactionFromRaw.object.outs.length; j++) {
                            const out = transactionFromRaw.object.outs[j] as any; // bitcoinjs.Output
                            try {
                                const outputAddress = Address.fromOutputScript(out.script, network);
                                if (outputAddress === address.value) {
                                    transaction.satoshis += out.value;
                                }
                            } catch (exception) {
                                // tslint:disable-next-line:no-console
                                console.info('Unsupported output script :' + out.script);
                            }
                        }
                        for (let j = 0; j < transactionFromRaw.object.ins.length; j++) {
                            transactionArray[i].inCount++;
                        }
                    }
                }
                return transactionArrayArray;
            }));
    }

    transactionIdListOf(transactionListList: WsTransaction[][]) {
        const transactionIdList = new Array<string>();
        for (const transactionList of transactionListList) {
            for (const transaction of transactionList) {
                transactionIdList.push(transaction.id);
            }
        }
        return transactionIdList;
    }

}
