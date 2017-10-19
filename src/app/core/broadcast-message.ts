import {BroadcastMessage as BitpayBroadcastMessage} from '../core/bitpay/broadcast-message';

export class BroadcastMessage implements BitpayBroadcastMessage {
    
    constructor(public rawtx: string){}

}