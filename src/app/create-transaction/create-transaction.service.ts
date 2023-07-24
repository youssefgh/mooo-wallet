import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Big } from 'big.js';
import { ConversionService } from '../conversion.service';
import { Utxo } from '../core/bitcoinjs/utxo';
import { ConfirmedTransaction } from '../core/bitcoinjs/confirmed-transaction';
import { Derived } from '../core/bitcoinjs/derived';
import { Network } from '../core/bitcoinjs/network';
import { Call } from '../core/electrum/call';
import { JsonRpcResponse } from '../core/electrum/json-rpc-response';
import { Procedure } from '../core/electrum/procedure';

@Injectable({
    providedIn: 'root'
})
export class CreateTransactionService {

    constructor(private httpClient: HttpClient,
        private conversionService: ConversionService) { }

    calculateBalance(utxoArray: Utxo[]) {
        let balance = new Big(0);
        for (const utxo of utxoArray) {
            balance = balance.plus(utxo.satoshis);
            balance.plus(new Big(0));
        }
        return balance;
    }

    async loadUTXO(derivedList: Array<Derived>, electrumProtocol: string,
        proxyAddress: string, network: Network) {
        const call = new Call();
        call.procedureList.push(this.serverVersionProcedure(1, electrumProtocol).toString());
        let procedure = new Procedure(2, 'blockchain.headers.subscribe');
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(3, 'blockchain.relayfee');
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(4, 'blockchain.estimatefee');
        procedure.params.push(1);
        call.procedureList.push(procedure.toString());
        let i = 5;
        derivedList.forEach(derived => {
            procedure = new Procedure(i, 'blockchain.scripthash.listunspent');
            procedure.params.push(derived.address.scriptHash(network));
            call.procedureList.push(procedure.toString());
            i++;
        });
        const response = await this.httpClient.post<string[]>(proxyAddress + '/proxy', call).toPromise();
        let responseList = JsonRpcResponse.listFrom(response);
        const lastBlockHeight: number = responseList[1].result.height;
        const minimumRelayFeeInBtc = responseList[2].result;
        const estimatefeeInBtc = responseList[3].result;
        let utxoArray = new Array<Utxo>();
        for (let index = 4; index < responseList.length; index++) {
            const utxoList = responseList[index].result;
            for (const item of utxoList) {
                const utxo = new Utxo();
                const confirmedTransaction = new ConfirmedTransaction();
                utxo.transaction = confirmedTransaction;
                confirmedTransaction.id = item.tx_hash;
                confirmedTransaction.height = item.height;
                utxo.vout = item.tx_pos;
                utxo.satoshis = item.value;
                // TODO use big
                utxo.amount = parseFloat(this.conversionService.satoshiToBitcoin(utxo.satoshis).toFixed(8));
                utxo.derived = derivedList[index - 4];
                if (confirmedTransaction.height > 0) {
                    confirmedTransaction.confirmations = lastBlockHeight - confirmedTransaction.height + 1;
                } else {
                    confirmedTransaction.confirmations = 0;
                }
                utxoArray.push(utxo);
            }
            utxoArray = utxoArray.filter((utxo: Utxo) => utxo.transaction.confirmations > 0);
        }

        const rawTransactionArray = await this.rawTransactionListFrom(utxoArray,
            electrumProtocol, proxyAddress);
        let j = 0;
        utxoArray.forEach(transaction => {
            transaction.transactionHex = rawTransactionArray[j];
            j++;
        });
        return { minimumRelayFeeInBtc, estimatefeeInBtc, utxoArray };
    }

    async rawTransactionListFrom(utxoArray: Array<Utxo>, electrumProtocol: string,
        proxyAddress: string) {
        const call = new Call();
        call.procedureList.push(this.serverVersionProcedure(1, electrumProtocol).toString());
        let i = 1;
        utxoArray.forEach(utxo => {
            let procedure = new Procedure(++i, 'blockchain.transaction.get');
            procedure.params.push(utxo.transaction.id);
            call.procedureList.push(procedure.toString());
        });
        let data = await this.httpClient.post<string[]>(proxyAddress + '/proxy', call).toPromise();
        data = data.map(d => JSON.parse(d))
            .sort((a, b) => a.id > b.id ? 1 : -1)
            .slice(1)
            .map(d => d.result);
        return data;
    }

    async loadHistoryFrom(derivedList: Array<Derived>,
        electrumProtocol: string,
        proxyAddress: string, network: Network) {
        const call = new Call();
        call.procedureList.push(this.serverVersionProcedure(1, electrumProtocol).toString());
        let procedure = new Procedure(2, 'blockchain.headers.subscribe');
        call.procedureList.push(procedure.toString());
        let i = 3;
        derivedList.forEach(derived => {
            procedure = new Procedure(i++, 'blockchain.scripthash.get_history');
            procedure.params.push(derived.address.scriptHash(network));
            call.procedureList.push(procedure.toString());
        });
        const response = await this.httpClient.post<Array<string>>(proxyAddress + '/proxy', call).toPromise();
        let responseList = JsonRpcResponse.listFrom(response);
        const lastBlockHeight: number = responseList[1].result.height;
        const historyArray = new Array<Array<ConfirmedTransaction>>();
        for (let index = 2; index < responseList.length; index++) {
            const response = responseList[index];
            const transactionArray = new Array<ConfirmedTransaction>();
            for (const item of response.result.reverse()) {
                const transaction = new ConfirmedTransaction;
                transaction.id = item.tx_hash;
                transaction.height = item.height;
                if (transaction.height > 0) {
                    transaction.confirmations = lastBlockHeight - transaction.height + 1;
                } else {
                    transaction.confirmations = 0;
                }
                transactionArray.push(transaction);
            }
            historyArray.push(transactionArray);
        }
        return historyArray;
    }

    serverVersionProcedure(i: number, electrumProtocol: string) {
        const procedure = new Procedure(i, 'server.version');
        procedure.params.push(electrumProtocol);
        procedure.params.push(electrumProtocol);
        return procedure;
    }

}
