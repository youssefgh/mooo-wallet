import {EnvironementService} from '../environement.service';
import {Component, OnInit} from '@angular/core';
import {TransactionBuilder, Transaction, networks, ECPair} from 'bitcoinjs-lib';
import * as Wif from 'wif';
import * as bip38 from 'bip38';

@Component({
    selector: 'app-sign-transaction',
    templateUrl: './sign-transaction.component.html',
    styleUrls: ['./sign-transaction.component.css']
})
export class SignTransactionComponent implements OnInit {

    rawTransaction: string;
    //    wif: string;
    key: string;
//    passphrase: string;
    signedTransactionHex: string;

    constructor(private environementService: EnvironementService) {}

    ngOnInit() {
//        this.key = "6PRUYb3qMhoR8XcUbqecxArfT4jS7qMjcwn8mMUnrsBeR4ecrinupk3nxs"
        this.key = "520b0f4fa9665992da1757d343c5d2701d209d98584d16c704de2aac02e25ab6"
//        this.passphrase = "123"
        this.rawTransaction = "01000000021afb221c7f8200e96743e2e640978c412fc721ee9d853c8458427af8be35fcac0000000000ffffffffc7e2a77d3dbfa8ec98ce1cb5acc4dddb70d42ae9da8dd5a5bd3c70e167592e800100000000ffffffff01e049630e00000000226d6f7232596948396543625869454a335463577145583259617751597a536832674d00000000"
    }

    sign() {
        var network = this.environementService.network;
        //        var decryptedKey = bip38.decrypt("6PYWxckdxptLske7Bggy5ZpRLLM6LNLkTUvYHpy5WxA71XEy2zVKwhpM7K", "123", function (status) {
        //            console.log(status.percent) // will print the precent every time current increases by 1000
        //        });
        var transaction = Transaction.fromHex(this.rawTransaction);
        var transactionBuilder = TransactionBuilder.fromTransaction(transaction, network);
        var inputArray = transaction.ins;
        debugger
        for (var i = 0; i < inputArray.length; i++) {
            //            if (this.passphrase != null && this.p assphrase.length > 0) {

            //                            var privateKey = decryptedKey.privateKey;
            //                        } else {
            var privateKey = this.key;
            //                        }
            //                        console.log("test20");
            //                        console.log(privateKey);
            var privateKeyBuffer = new Buffer(privateKey, "hex");
            var wif = Wif.encode(239, privateKeyBuffer, true);
            transactionBuilder.sign(i, ECPair.fromWIF(wif, network));
        }
        var signedTransaction = transactionBuilder.build();
        this.signedTransactionHex = signedTransaction.toHex();
    }

//    isKeyEncrypted() {
//        return this.key.startsWith('6P');
//    }

}
