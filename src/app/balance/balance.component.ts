import {environment} from '../../environments/environment';
import {SendService} from '../send.service';
import {Component, OnInit} from '@angular/core';
import * as bitcoinjs from 'bitcoinjs-lib';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Transaction} from '../core/transaction';
import {Call} from '../core/electrum/call';
import {Procedure} from '../core/electrum/procedure';
import {JsonRpcResponse} from '../core/electrum/json-rpc-response';

declare var M: any;

@Component({
    selector: 'app-balance',
    templateUrl: './balance.component.html',
    styleUrls: ['./balance.component.css']
})
export class BalanceComponent implements OnInit {

    environment = environment;
    address: string;
    confirmedBalance: string;
    unconfirmedBalance: string;
    transactionArray: Transaction[];

    constructor(private httpClient: HttpClient, private sendService: SendService) {}

    ngOnInit() {
    }

    loadBalance() {
        if (this.address == null || !this.sendService.isValidAddress(this.address, environment.network)) {
            M.toast({html: 'Incorrect address !'});
            return;
        }
        let call = new Call(environment.electrumServer, environment.electrumPort);
        let procedure = new Procedure(1, "server.version");
        procedure.params.push(environment.electrumProtocol);
        procedure.params.push(environment.electrumProtocol);
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(2, "blockchain.scripthash.get_balance");
        procedure.params.push(this.sendService.scriptHashFrom(this.address));
        call.procedureList.push(procedure.toString());
        this.httpClient.post<any[]>(environment.proxyAddress + '/tcp-rest-proxy/api/proxy', call).subscribe(data => {
            let responseList = new Array<JsonRpcResponse>();
            for (let responseString of data) {
                let response = JsonRpcResponse.from(responseString);
                if (response.error) {
                    M.toast({html: 'Error while getting th balance ! ' + response.error.message});
                    console.error(response.error);
                    return;
                }
                responseList.push(response);
            }
            responseList = responseList.sort((a, b) => a.id > b.id ? 1 : -1)
            let result = responseList[1].result;
            this.confirmedBalance = this.sendService.satoshiToBitcoin(result.confirmed).valueOf();
            this.unconfirmedBalance = this.sendService.satoshiToBitcoin(result.unconfirmed).valueOf();
        }, (error: HttpErrorResponse) => {
            M.toast({html: 'Error while connecting to the proxy server! please try again later'});
            console.error(error);
        });
    }

    reloadBalance() {
        this.confirmedBalance = null;
        this.unconfirmedBalance = null;
        this.transactionArray = null;
        this.loadBalance();
    }

    loadHistory() {
        let call = new Call(environment.electrumServer, environment.electrumPort);
        let procedure = new Procedure(1, "server.version");
        procedure.params.push(environment.electrumProtocol);
        procedure.params.push(environment.electrumProtocol);
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(2, "blockchain.headers.subscribe");
        call.procedureList.push(procedure.toString());
        procedure = new Procedure(3, "blockchain.scripthash.get_history");
        procedure.params.push(this.sendService.scriptHashFrom(this.address));
        call.procedureList.push(procedure.toString());
        this.httpClient.post<any[]>(environment.proxyAddress + '/tcp-rest-proxy/api/proxy', call).subscribe(data => {
            let responseList = new Array<JsonRpcResponse>();
            for (let responseString of data) {
                let response = JsonRpcResponse.from(responseString);
                if (response.error) {
                    M.toast({html: 'Sending error ! Tx: ' + response.error.message});
                    console.error(response.error);
                    return;
                }
                responseList.push(response);
            }
            responseList = responseList.sort((a, b) => a.id > b.id ? 1 : -1)
            let lastBlockHeight: number = responseList[1].result.block_height;
            let transactionArray = new Array<Transaction>();
            for (let item of responseList[2].result.reverse()) {
                let transaction = new Transaction();
                transaction.id = item.tx_hash;
                transaction.satoshis = 0;
                transaction.height = item.height;
                if (transaction.height != 0)
                    transaction.confirmations = lastBlockHeight - transaction.height + 1;
                else
                    transaction.confirmations = 0;
                transactionArray.push(transaction);
            }
            this.rawTransactionOf(this.transactionIdListOf(transactionArray)).subscribe(data => {
                let transactionIdList = new Array<string>();
                data = data.sort((a, b) => a.id > b.id ? 1 : -1)
                for (let i = 0; i < transactionArray.length; i++) {
                    let transactionFromRaw = bitcoinjs.Transaction.fromHex(JSON.parse(data[i + 1]).result);
                    for (let j = 0; j < transactionFromRaw.outs.length; j++) {
                        let out = transactionFromRaw.outs[j];
                        try {
                            if (bitcoinjs.address.fromOutputScript(out.script, this.environment.network) === this.address) {
                                transactionArray[i].satoshis += out.value;
                            }
                        } catch (exception) {
                            console.info('Unsupported output script :' + out.script)
                        }
                    }
                    for (let j = 0; j < transactionFromRaw.ins.length; j++) {
                        let inp = transactionFromRaw.ins[j];
                        transactionIdList.push(new Buffer(inp.hash.reverse()).toString('hex'));
                        transactionArray[i].inList.push(inp);
                    }
                }
                this.rawTransactionOf(transactionIdList).subscribe(data => {
                    data = data.sort((a, b) => a.id > b.id ? 1 : -1)
                    let k = 1;
                    for (let i = 0; i < transactionArray.length; i++) {
                        let transaction = transactionArray[i];
                        for (let j = 0; j < transaction.inList.length; j++ , k++) {
                            let inp = transaction.inList[j];
                            let inputTransaction = bitcoinjs.Transaction.fromHex(JSON.parse(data[k]).result);
                            for (let l = 0; l < inputTransaction.outs.length; l++) {
                                let out = inputTransaction.outs[l]
                                try {
                                    if (bitcoinjs.address.fromOutputScript(out.script, this.environment.network) === this.address) {
                                        transaction.satoshis -= out.value;
                                    }
                                } catch (exception) {
                                    console.info('Unsupported output script :' + out.script)
                                }
                            }
                        }
                    }
                    for (let transaction of transactionArray) {
                        transaction.amount = parseFloat(this.sendService.satoshiToBitcoin(transaction.satoshis).valueOf());
                    }
                    this.transactionArray = transactionArray;
                });
            });
        }, (error: HttpErrorResponse) => {
            M.toast({html: 'Error while connecting to the proxy server! please try again later'});
            console.error(error);
        });
    }

    rawTransactionOf(transactionIdList: string[]) {
        let call = new Call(environment.electrumServer, environment.electrumPort);
        let procedure = new Procedure(1, "server.version");
        procedure.params.push(environment.electrumProtocol);
        procedure.params.push(environment.electrumProtocol);
        call.procedureList.push(procedure.toString());
        let i = 1;
        for (let id of transactionIdList) {
            procedure = new Procedure(++i, "blockchain.transaction.get");
            procedure.params.push(id);
            call.procedureList.push(procedure.toString());
        }
        return this.httpClient.post<any[]>(environment.proxyAddress + '/tcp-rest-proxy/api/proxy', call);
    }

    transactionIdListOf(transactionList: Transaction[]) {
        let transactionIdList = new Array<string>();
        for (let transaction of transactionList) {
            transactionIdList.push(transaction.id)
        }
        return transactionIdList;
    }

    clear() {
        this.address = null;
        this.confirmedBalance = null;
        this.unconfirmedBalance = null;
        this.transactionArray = null;
    }

}
