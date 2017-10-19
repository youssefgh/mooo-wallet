import {environment} from '../../environments/environment';
import {Component, OnInit} from '@angular/core';
import {} from 'bitcoinjs-lib';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Address} from '../core/address';

@Component({
    selector: 'app-balance',
    templateUrl: './balance.component.html',
    styleUrls: ['./balance.component.css']
})
export class BalanceComponent implements OnInit {

    environment = environment;
    address: string;
    addressResponse: Address;

    constructor(private httpClient: HttpClient) {}

    ngOnInit() {
    }
    
    load(){
        this.httpClient.get<Address>(environment.blockexplorerAddress + '/addr/' + this.address,
            {headers: new HttpHeaders()})
            .subscribe(data => {
                this.addressResponse = data;
            });
    }

}
