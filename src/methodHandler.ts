import {Transport} from './transport'
import {Subscription} from './data/subscription'

export class MethodHandler {
    private topic = {
        post:'$iothub/methods/POST/#',
        response:'$iothub/methods/res/',
        regexr: {
            post:'\\$iothub/methods/POST/([^/]*)/\\?\\$rid=(\\d+)',
        },
    };
    private registeredMethods: any;
    private transport: Transport;
    private rid: number;
    private postSub: Subscription;

    constructor(transport: Transport) {
        this.transport = transport;
        this.postSub = {
            topic:this.topic.post,
            topicReg:new RegExp(this.topic.regexr.post),
            qos:0,
            messageHandler: this._onMethodCalled.bind(this)
        };
        this.registeredMethods = [];
    }

    public addMethod(name: string,payload: string, statusCode: number,delay: number) {
        if(name in this.registeredMethods) {
            alert('method name already exist!');
            return;
        }
        if(!this.checkMethodPara(payload,statusCode,delay)) {
            return;
        }
        this.registeredMethods[name] = {
            'payload':payload,
            'statusCode':statusCode,
            'delay':delay
        };
        //add ui
    }
    
    public initialize() {
        this.transport.subscribe(this.postSub);
    }

    public uninitialize() {
        this.transport.unsubscribe(this.postSub);
    }

    public removeMethod(name: string) {
        delete this.registeredMethods[name];
    }

    public sendResponse(payload: string,statusCode: number,rid: number) {
        var topic = this.topic.response + statusCode + '/?$rid=' + rid;
        var body = payload;
        //alert(websocketclient.publish);
        this.transport.publish(topic,body,0,false);
        //websocketclient.appendToMethodTerminal('Response sent');
    }

    public onMethodCalled: (topic: string,payload: string)=>{

    };

    public _onMethodCalled(topic: string,payload: string) {
        if(this.onMethodCalled) {
            this.onMethodCalled(topic,payload);
        }
        var reg = new RegExp(this.topic.regexr.post);
        var resultArray = reg.exec(topic);
        if(!resultArray || !resultArray[1] || !resultArray[2]) {
            return;
        }
        var methodName = resultArray[1];
        var rid = resultArray[2];
        if( ! (methodName in this.registeredMethods)) {
            //websocketclient.appendToMethodTerminal('server called method '+methodName+' not registered.');
            return;
        }
        var methodObj = this.registeredMethods[methodName];
        //websocketclient.appendToMethodTerminal('Method ' + methodName + ' called.');
        //websocketclient.appendToMethodTerminal('Will return status code:'+methodObj.statusCode+',response:'+methodObj.payload+' in '+methodObj.delay+' ms delay');
        setTimeout(this.sendResponse.bind(this,methodObj.payload,methodObj.statusCode,rid),parseInt(methodObj.delay));
    }

    private checkMethodPara(payload: string,statusCode: number,delay: number) {
        if(isNaN(statusCode) || isNaN(delay)) {
            alert('status code and delay must be integer');
            return false;
        }
        return true;
    }

}