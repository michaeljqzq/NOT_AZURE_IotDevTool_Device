import {Transport} from './transport'
import {Subscription} from './data/subscription'

export class MessageHandler {
    //private processQueue: any;
    private transport: Transport;
    private messageSub: Subscription;

    private topic: any;

    public onMessageArrived = (topic: string, payload: string) => {

    };

    constructor(transport: Transport) {
        this.transport = transport;
        this.topic = {
            message:'devices/' + this.transport.getClientId() + '/messages/devicebound/#',
            regexr: {
                message:'devices/' + this.transport.getClientId() + '/messages/devicebound/'
            }
        };
    }

    public initialize() {
        this.messageSub = {
            topic:this.topic.message,
            topicReg:new RegExp(this.topic.regexr.message),
            qos:0,
            messageHandler:this.onMessageArrived.bind(this)
        };
        this.transport.subscribe(this.messageSub);
    }

    public uninitialize() {
        this.transport.unsubscribe(this.messageSub);
    }

    public sendMessage(topic: string,payload: string, qos: number, retain: boolean) {
        if(isNaN(qos) || qos<0 || qos>1) {
            return;
        }
        this.transport.publish(topic,payload,qos,retain);
    }

}