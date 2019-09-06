import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, mapTo } from 'rxjs/operators';
import { SendService } from './send.service';
import { Call } from './core/electrum/call';
import { Transaction } from './core/transaction';
import { Procedure } from './core/electrum/procedure';
import { ConversionService } from './conversion.service';
import { JsonRpcResponse } from './core/electrum/json-rpc-response';
import * as bitcoinjs from 'bitcoinjs-lib';
import { throwError } from 'rxjs';
import { Derived } from './core/derived';

@Injectable({
    providedIn: 'root'
})
export class BalanceService {

    constructor(private httpClient: HttpClient, private sendService: SendService, private conversionService: ConversionService) { }

    loadBalanceFrom(addressList: Array<string>, environment) {
        let call = new Call(environment.electrumServer, environment.electrumPort)
        let procedure = new Procedure(1, "server.version")
        procedure.params.push(environment.electrumProtocol)
        procedure.params.push(environment.electrumProtocol)
        call.procedureList.push(procedure.toString())
        let i = 2
        addressList.forEach(address => {
            procedure = new Procedure(i++, "blockchain.scripthash.get_balance")
            procedure.params.push(this.sendService.scriptHashFrom(address, environment))
            call.procedureList.push(procedure.toString())
        })
        return this.httpClient.post<any[]>(environment.proxyAddress + '/api/proxy', call).pipe(map(data => {
            let responseList = new Array<JsonRpcResponse>()
            for (let responseString of data) {
                let response = JsonRpcResponse.from(responseString)
                if (response.error) {
                    return throwError(response.error.message)
                }
                responseList.push(response)
            }
            responseList = responseList.sort((a, b) => a.id > b.id ? 1 : -1)
            return responseList
        }))
    }

    loadHistoryFrom(derivedList: Array<Derived>, environment) {
        let call = new Call(environment.electrumServer, environment.electrumPort)
        let procedure = new Procedure(1, "server.version")
        procedure.params.push(environment.electrumProtocol)
        procedure.params.push(environment.electrumProtocol)
        call.procedureList.push(procedure.toString())
        procedure = new Procedure(2, "blockchain.headers.subscribe")
        call.procedureList.push(procedure.toString())
        let i = 3
        derivedList.forEach(derived => {
            procedure = new Procedure(i++, "blockchain.scripthash.get_history")
            procedure.params.push(this.sendService.scriptHashFrom(derived.address, environment))
            call.procedureList.push(procedure.toString())
        })
        return this.httpClient.post<any[]>(environment.proxyAddress + '/api/proxy', call).pipe(map(data => {
            let responseList = new Array<JsonRpcResponse>()
            for (let responseString of data) {
                let response = JsonRpcResponse.from(responseString)
                if (response.error) {
                    return throwError(response.error.message)
                }
                responseList.push(response)
            }
            responseList = responseList.sort((a, b) => a.id > b.id ? 1 : -1)
            let lastBlockHeight: number = responseList[1].result.height
            let transactionArrayArray = new Array<Array<Transaction>>()
            for (let index = 2; index < responseList.length; index++) {
                const response = responseList[index]
                let transactionArray = new Array<Transaction>()
                for (let item of response.result.reverse()) {
                    let transaction = new Transaction
                    transaction.inCount = 0
                    transaction.id = item.tx_hash
                    transaction.satoshis = 0
                    transaction.height = item.height
                    if (transaction.height > 0)
                        transaction.confirmations = lastBlockHeight - transaction.height + 1
                    else
                        transaction.confirmations = 0
                    transactionArray.push(transaction)
                }
                transactionArrayArray.push(transactionArray)
            }
            return transactionArrayArray
        }))
    }

    rawTransactionOf(transactionIdList: string[], environment) {
        let call = new Call(environment.electrumServer, environment.electrumPort)
        let procedure = new Procedure(1, "server.version")
        procedure.params.push(environment.electrumProtocol)
        procedure.params.push(environment.electrumProtocol)
        call.procedureList.push(procedure.toString())
        let i = 1
        for (let id of transactionIdList) {
            procedure = new Procedure(++i, "blockchain.transaction.get")
            procedure.params.push(id)
            call.procedureList.push(procedure.toString())
        }
        return this.httpClient.post<any[]>(environment.proxyAddress + '/api/proxy', call)
    }

    transactionOf(derivedList: Array<Derived>, transactionArrayArray: Array<Array<Transaction>>, environment) {
        return this.rawTransactionOf(this.transactionIdListOf(transactionArrayArray), environment).pipe(map(data => {
            let transactionIdList = new Array<string>()
            data = data.map(d => JSON.parse(d)).sort((a, b) => a.id > b.id ? 1 : -1)
            for (let h = 0; h < transactionArrayArray.length; h++) {
                let transactionArray = transactionArrayArray[h]
                let address = derivedList[h].address
                for (let i = 0; i < transactionArray.length; i++) {
                    let transaction = transactionArray[i]
                    let transactionFromRaw = bitcoinjs.Transaction.fromHex(data[h + 1].result)
                    for (let j = 0; j < transactionFromRaw.outs.length; j++) {
                        let out = transactionFromRaw.outs[j] as any//bitcoinjs.Output
                        try {
                            let outputAddress = bitcoinjs.address.fromOutputScript(out.script, environment.network)
                            if (outputAddress === address) {
                                transaction.satoshis += out.value
                            }
                        } catch (exception) {
                            console.info('Unsupported output script :' + out.script)
                        }
                    }
                    for (let j = 0; j < transactionFromRaw.ins.length; j++) {
                        let inp = transactionFromRaw.ins[j]
                        transactionIdList.push(new Buffer(inp.hash.reverse()).toString('hex'))
                        transactionArray[i].inCount++
                    }
                }
            }
            return transactionArrayArray
        }))
    }

    transactionIdListOf(transactionListList: Transaction[][]) {
        let transactionIdList = new Array<string>()
        for (let transactionList of transactionListList) {
            for (let transaction of transactionList) {
                transactionIdList.push(transaction.id)
            }
        }
        return transactionIdList
    }

}
