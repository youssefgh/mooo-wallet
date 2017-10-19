import {environment} from '../environments/environment';
import {Injectable} from '@angular/core';
import {Network, networks} from 'bitcoinjs-lib';

@Injectable()
export class EnvironementService {

    network: Network;
//    environment = environment;

    constructor() {
        if (!environment.testnet) {
            this.network = networks.bitcoin;
        } else {
            this.network = networks.testnet;
        }
    }

}
