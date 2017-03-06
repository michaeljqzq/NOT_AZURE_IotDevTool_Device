import {Transport} from './transport'
import {Subscription} from './data/subscription'

export class TwinHandler {
    private topic = {
        desired:'$iothub/twin/PATCH/properties/desired/#',
        reported:'$iothub/twin/PATCH/properties/reported/',
        get:'$iothub/twin/GET/',
        response:'$iothub/twin/res/#',
        regexr: {
            desired:'\\$iothub/twin/PATCH/properties/desired/.*',
            response:'\\$iothub/twin/res/(\\d+)/.*\\$rid=(\\d+).*',
        }
    };

    private transport: Transport;
    private rid: number;
    private desiredSub: Subscription;
    private responseSub: Subscription;
    private eventQueue: any;

    constructor(transport: Transport) {
        this.transport = transport;
        this.desiredSub = {
            topic:this.topic.desired,
            topicReg:new RegExp(this.topic.regexr.desired),
            qos:0,
            messageHandler:this._onDesiredTwinUpdate.bind(this)
        };
        this.responseSub = {
            topic:this.topic.response,
            topicReg:new RegExp(this.topic.regexr.response),
            qos:0,
            messageHandler:this.onTwinMessageArrived.bind(this)
        };
        this.rid = 1234;
        this.eventQueue = {};
    }

    public initialize() {
        this.transport.subscribe(this.desiredSub);
        this.transport.subscribe(this.responseSub);
    }

    public uninitialize() {
        this.transport.unsubscribe(this.desiredSub);
        this.transport.unsubscribe(this.responseSub);
    }

    public getTwin(callback: Function) {
        this.transport.publish(this.topic.get+'?$rid='+this.rid,'',0,false);
        this.eventQueue[this.rid] = callback;
        this.rid++;
    }

    public updateReported(content: string,callback: Function) {
        try {
            var body = JSON.parse(content);
        }catch(e) {
            alert('Reported properties is not valid JSON');
            return;
        }
        this.transport.publish(this.topic.reported+'?$rid='+this.rid,content,0,false);
        this.eventQueue[this.rid] = callback;
        this.rid++;
    }

    public onTwinMessageArrived(topic: string,payload: string) {
        var reg = new RegExp(this.topic.regexr.response);
        var resultArray = reg.exec(topic);
        if(!resultArray || !resultArray[1] || !resultArray[2]) {
            return;
        }
        if(resultArray[2] in this.eventQueue) {
            this.eventQueue[resultArray[2]](topic,payload);
            delete this.eventQueue[resultArray[2]];
        }
    }

    public onDesiredTwinUpdate = (topic: string,payload: string) => {
        
    }

    public _onDesiredTwinUpdate(topic: string,payload: string) {
        if(this.onDesiredTwinUpdate) {
            this.onDesiredTwinUpdate(topic,payload);
        }
    }

}