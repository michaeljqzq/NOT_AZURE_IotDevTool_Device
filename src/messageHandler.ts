import {Transport} from './transport'
import {Subscription} from './data/subscription'

export class MessageHandler {
    //private processQueue: any;
    private transport: Transport;
    private messageUICallback: Function;
    private messageSub: Subscription;

    private topic: any;

    constructor(transport: Transport,messageUICallback: Function) {
        this.transport = transport;
        this.topic = {
            message:'devices/' + this.transport.getClientId() + '/messages/devicebound/#',
            regexr: {
                message:'devices/' + this.transport.getClientId() + '/messages/devicebound/'
            }
        };
        this.messageUICallback = messageUICallback;

        this.messageSub = {
            topic:this.topic.message,
            topicReg:new RegExp(this.topic.regexr.message),
            qos:0,
            color:'ffbb00',
            messageHandler:this.onMessageArrived
        };
    }

    public initialize() {
        this.transport.subscribe(this.messageSub);
    }

    public uninitialize() {
        this.transport.unsubscribe(this.messageSub);
    }

    public onMessageArrived(topic: string,payload: string) {

    }

    public sendMessage(topic: string,payload: string, qos: number, retain: boolean) {
        if(isNaN(qos) || qos<0 || qos>1) {
            return;
        }
        this.transport.publish(topic,payload,qos,retain);
    }

}