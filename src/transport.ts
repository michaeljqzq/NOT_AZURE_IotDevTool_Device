import {Util} from './util';
import {Subscription} from './data/subscription'

declare var Paho: any;
declare var moment: any;

export class Transport {
    private client: any;
    private lastMessageId: number;
    private lastSubId: number;
    private subscriptions: Subscription[];
    private connected: boolean;
    private clientId: string;

    private options = {
            timeout: 3,
            cleanSession: true,
            mqttVersion: 4,
            useSSL: true,
            onSuccess: this.onConnect,
            onFailure: this.onFail,
            keepAliveInterval: null,
            userName: null,
            password: null
    };

    constructor(connectionString: string,keepAlive: number) {
        var ops = Util.getOptionsFromConnectionString(connectionString);
        this.options.keepAliveInterval = keepAlive;
        this.options.userName = ops.username;
        this.options.password = ops.password;
        this.clientId = ops.clientId;

        this.client = new Paho.MQTT.Client(ops.host, ops.port, '/$iothub/websocket', ops.clientId);
        this.client.onConnectionLost = this.onConnectionLost;
        this.client.onMessageArrived = this.dispatchMessage;
        //ui fill. not do here
    }

    public connect(success, fail) {
        var options = {};
        for (var key in this.options) {
            if (success && key === 'onSuccess') {
                options[key] = success;
            } else if (fail && key === 'onFailure') {
                options[key] = fail;
            } else {
                options[key] = this.options[key];
            }
        }
        this.client.connect(options);
    }

    public disconnect() {
        this.client.disconnect();
    }

    public subscribe(subscription: Subscription) {
        if (!this.connected) {
            // websocketclient.render.showError("Not connected");
            return false;
        }

        if (subscription.topic.length < 1) {
            // websocketclient.render.showError("Topic cannot be empty");
            return false;
        }

        if (this.subscriptions.some((s)=>{return s.topic == subscription.topic})) {
            // websocketclient.render.showError('You are already subscribed to this topic');
            return false;
        }

        this.client.subscribe(subscription.topic, {qos: subscription.qos});
        if (subscription.color.length < 1) {
            subscription.color = '999999';
        }
        this.subscriptions.push(subscription);
        return true;
    }

    public publish(topic: string, payload: string, qos: number, retain: boolean) {

        if (!this.connected) {
            //websocketclient.render.showError("Not connected");
            return false;
        }

        var message = new Paho.MQTT.Message(payload);
        message.destinationName = topic;
        message.qos = qos;
        message.retained = retain;
        this.client.send(message);
    }

    public unsubscribe(subscription: Subscription) {
        this.client.unsubscribe(subscription.topic);
    }

    public getClientId() {
        return this.clientId;
    }

    private onConnect() {
        this.connected = true;
        console.log("connected");
        //$('#publishTopic').val('devices/' + this.clientId + '/messages/events/');
        //TODO ADD INTERFACE MESSAGE, TWIN/METHODS WILL EXTEND THIS INTERFACE
        // this.subscribe('devices/' + this.clientId + '/messages/devicebound/#',0,'ffbb00');
        // websocketclient.subscribe(websocketclient.twinTopic.desired,0,'7cbb00');
        // websocketclient.subscribe(websocketclient.twinTopic.response,0,'00a1f1');
        // websocketclient.subscribe(websocketclient.methodTopic.post,0,'f65314');
    }

    private onFail() {
        this.connected = false;
        //show error
    }

    private dispatchMessage(message: any) {

        var subscription = this.getSubscriptionForTopic(message.destinationName);

        var messageObj: any = {
            'topic': message.destinationName,
            'retained': message.retained,
            'qos': message.qos,
            'payload': message.payloadString,
            'timestamp': moment(),
            'color': subscription.color
        };

        console.log(messageObj);
        subscription.messageHandler(messageObj.topic,messageObj.payload,messageObj);
    }

    private onConnectionLost(responseObject: any) {
        this.connected = false;
        if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }
        // $('body.connected').removeClass('connected').addClass('notconnected').addClass('connectionbroke');
        // websocketclient.render.show('conni');
        // websocketclient.render.hide('publish');
        // websocketclient.render.hide('sub');
        // websocketclient.render.hide('messages');
        // websocketclient.render.hide('twin');
        // websocketclient.render.hide('method');

        //Cleanup messages
        // websocketclient.render.clearMessages();

        //Cleanup subscriptions
        this.subscriptions = [];
        // websocketclient.render.clearSubscriptions();
    }

    private getSubscriptionForTopic(topic: string): Subscription {
        var i;
        for (i = 0; i < this.subscriptions.length; i++) {
            if (this.compareTopics(topic, this.subscriptions[i].topic)) {
                return this.subscriptions[i];
            }
        }
        return null;
    }

    private compareTopics(topic, subTopic) {
        var pattern = subTopic.replace("+", "(.+?)").replace("#", "(.*)");
        var regex = new RegExp("^" + pattern + "$");
        return regex.test(topic);
    }


}