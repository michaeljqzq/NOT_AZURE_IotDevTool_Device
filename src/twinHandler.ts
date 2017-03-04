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

    //private processQueue: any;
    private transport: Transport;
    private twinUIElement: string;
    private rid: number;
    private desiredSub: Subscription;
    private responseSub: Subscription;
    private twinUICallback: Function;

    constructor(transport: Transport,twinUICallback: Function) {
        this.transport = transport;
        this.twinUICallback = twinUICallback;
        this.desiredSub = {
            topic:this.topic.desired,
            topicReg:new RegExp(this.topic.regexr.desired),
            qos:0,
            color:'7cbb00',
            messageHandler:this.onTwinMessageArrived
        };
        this.responseSub = {
            topic:this.topic.response,
            topicReg:new RegExp(this.topic.regexr.response),
            qos:0,
            color:'00a1f1',
            messageHandler:this.onGetTwinResponse
        };
        //this.processQueue = {};
    }

    public initialize() {
        this.transport.subscribe(this.desiredSub);
        this.transport.subscribe(this.responseSub);
    }

    public uninitialize() {
        this.transport.unsubscribe(this.desiredSub);
        this.transport.unsubscribe(this.responseSub);
    }

    public getTwin(doDesired: boolean,doReported: boolean) {
        //this.processQueue[this.rid] = this.onGetTwinResponse.bind(this,doDesired,doReported);
        this.transport.publish(this.topic.get+'?$rid='+this.rid,'',0,false);
        this.rid++;
    }

    public updateReported(content: string) {
        try {
            var body = JSON.parse(content);
        }catch(e) {
            alert('Reported properties is not valid JSON');
            return;
        }
        //this.processQueue[this.rid] = this.onUpdateReportedResponse;
        this.transport.publish(this.topic.reported+'?$rid='+this.rid,content,0,false);
        this.rid++;
    }

    public onTwinMessageArrived(topic: string,payload: string) {
        var reg = new RegExp(this.topic.regexr.response);
        var resultArray = reg.exec(topic);
        if(!resultArray || !resultArray[1] || !resultArray[2]) {
            return;
        }
        //this.processQueue[resultArray[2]](payload);
        //delete this.processQueue[resultArray[2]];
        console.log(resultArray);
    }

    private onUpdateReportedResponse() {
        this.getTwin(false,true);
    }

    private onUpdateDesired() {
        this.getTwin(true,false);
    }

    private onGetTwinResponse(doDesired: boolean,doReported: boolean,topic: string,payload: string) {
        try{
            payload = JSON.parse(payload);
        }catch(e){
            console.log('Twin is not JSON format');
            return;
        }
        if(doDesired) 1; //TODO update ui
        if(doReported) 1; // websocketclient.updateTextArea('#twin-reported',JSON.stringify(payload['reported'],null,2),true);
    }

}