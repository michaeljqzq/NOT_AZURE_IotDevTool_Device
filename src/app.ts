import {Transport} from './transport'
import {MessageHandler} from './messageHandler'
import {TwinHandler} from './twinHandler'
import {MethodHandler} from './methodHandler'

export class Main{
    public transport: Transport;
    public messageHandler: MessageHandler;
    public twinHandler: TwinHandler;
    public methodHandler: MethodHandler;
    public onConnected: any;
    public onDisconnected: any;

    constructor(connectionString: string,keepAlive: number) {
        this.transport = new Transport(connectionString,keepAlive);
        this.messageHandler = new MessageHandler(this.transport);
        this.twinHandler = new TwinHandler(this.transport);
        this.methodHandler = new MethodHandler(this.transport);
    }

    public connect() {
        this.transport.connect(() => {
            this.messageHandler.initialize();
            this.twinHandler.initialize();
            this.methodHandler.initialize();
            this.onConnected();
        }, this.onDisconnected);
    }

    public disconnect() {
        this.messageHandler.uninitialize();
        this.twinHandler.uninitialize();
        this.methodHandler.uninitialize();
        this.transport.disconnect();
    }
}