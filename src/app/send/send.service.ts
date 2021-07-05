import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Big } from 'big.js';
import { throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConversionService } from '../conversion.service';
import { Fee } from '../core/bitcoinfees/fee';
import { Network } from '../core/bitcoinjs/network';
import { Derived } from '../core/derived';
import { Call } from '../core/electrum/call';
import { JsonRpcResponse } from '../core/electrum/json-rpc-response';
import { Procedure } from '../core/electrum/procedure';
import { WsTransaction } from '../core/electrum/wsTransaction';

@Injectable({
    providedIn: 'root'
})
export class SendService {

    constructor(private httpClient: HttpClient,
        private conversionService: ConversionService) { }

    calculateBalance(utxoArray: WsTransaction[]) {
        let balance = new Big(0);
        for (const utxo of utxoArray) {
            balance = balance.plus(utxo.satoshis);
            balance.plus(new Big(0));
        }
        return balance;
    }

    feeForEstimatedConfirmationTime(minutes: number, feeArray: Fee[]) {
        for (const fee of feeArray) {
            if (fee.maxMinutes < 60) {
                return fee;
            }
        }
    }

    // transactionFee(transaction: bitcoinjs.Transaction, utxoArray: Array<Transaction>, satoshiPerByte: number) {
    //     let feeInSatoshi
    //     if (utxoArray[0].derived.purpose == 49 || utxoArray[0].derived.purpose == 84) {
    //         let virtualSize = transaction.virtualSize()
    //         feeInSatoshi = virtualSize * satoshiPerByte
    //     } else {
    //         let byteLength = transaction.byteLength()
    //         feeInSatoshi = byteLength * satoshiPerByte
    //     }
    //     return feeInSatoshi
    // }

    loadUTXO(derivedList: Array<Derived>, electrumProtocol: string,
        proxyAddress: string, network: Network) {
        const call = new Call();
        let procedure = new Procedure(1, 'server.version');
        procedure.params.push(electrumProtocol);
        procedure.params.push(electrumProtocol);
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(2, 'blockchain.headers.subscribe');
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(3, 'blockchain.relayfee');
        call.procedureList.push(procedure.toString());
        let i = 4;
        derivedList.forEach(derived => {
            procedure = new Procedure(i, 'blockchain.scripthash.listunspent');
            procedure.params.push(derived.address.scriptHash(network));
            call.procedureList.push(procedure.toString());
            i++;
        });
        return this.httpClient.post<any[]>(proxyAddress + '/proxy', call).pipe(map((data => {
            let responseList = new Array<JsonRpcResponse>();
            for (const responseString of data) {
                const response = JsonRpcResponse.from(responseString);
                if (response.error) {
                    throwError(response.error);
                }
                responseList.push(response);
            }
            responseList = responseList.sort((a, b) => a.id > b.id ? 1 : -1);
            const lastBlockHeight: number = responseList[1].result.height;
            const minimumRelayFeeInBtc = responseList[2].result;
            let utxoArray = new Array<WsTransaction>();
            for (let index = 3; index < responseList.length; index++) {
                const utxoList = responseList[index].result;
                for (const item of utxoList) {
                    const utxo = new WsTransaction();
                    utxo.id = item.tx_hash;
                    utxo.vout = item.tx_pos;
                    utxo.satoshis = item.value;
                    utxo.height = item.height;
                    // TODO use big
                    utxo.amount = parseFloat(this.conversionService.satoshiToBitcoin(utxo.satoshis).toFixed(8));
                    utxo.derived = derivedList[index - 3];
                    if (utxo.height > 0) {
                        utxo.confirmations = lastBlockHeight - utxo.height + 1;
                    } else {
                        utxo.confirmations = 0;
                    }
                    utxoArray.push(utxo);
                }
                utxoArray = utxoArray.filter((utxo: WsTransaction) => utxo.confirmations > 0);
            }
            return { 'minimumRelayFeeInBtc': minimumRelayFeeInBtc, 'utxoArray': utxoArray };
        })));
    }

    rawTransactionListFrom(utxoArray: Array<WsTransaction>, electrumProtocol: string,
        proxyAddress: string) {
        const call = new Call();
        let procedure = new Procedure(1, 'server.version');
        procedure.params.push(electrumProtocol);
        procedure.params.push(electrumProtocol);
        call.procedureList.push(procedure.toString());
        let i = 1;
        utxoArray.forEach(transaction => {
            procedure = new Procedure(++i, 'blockchain.transaction.get');
            procedure.params.push(transaction.id);
            call.procedureList.push(procedure.toString());
        });
        return this.httpClient.post<string[]>(proxyAddress + '/proxy', call).pipe(map(data => {
            data = data.map(d => JSON.parse(d))
                .sort((a, b) => a.id > b.id ? 1 : -1)
                .slice(1)
                .map(d => d.result);
            return data;
        }));
    }

    broadcast(transaction: string, electrumProtocol: string,
        proxyAddress: string) {
        const call = new Call();
        let procedure = new Procedure(1, 'server.version');
        procedure.params.push(electrumProtocol);
        procedure.params.push(electrumProtocol);
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(2, 'blockchain.transaction.broadcast');
        procedure.params.push(transaction);
        call.procedureList.push(procedure.toString());
        return this.httpClient.post<any[]>(proxyAddress + '/proxy', call);
    }

    loadHistoryFrom(derivedList: Array<Derived>,
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
        derivedList.forEach(derived => {
            procedure = new Procedure(i++, 'blockchain.scripthash.get_history');
            procedure.params.push(derived.address.scriptHash(network));
            call.procedureList.push(procedure.toString());
        });
        return this.httpClient.post<Array<string>>(proxyAddress + '/proxy', call).pipe(map(data => {
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

}
