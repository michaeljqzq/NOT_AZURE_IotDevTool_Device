import {Transport} from './transport'
import {MessageHandler} from './messageHandler'
import {TwinHandler} from './twinHandler'
import {MethodHandler} from './methodHandler'

export class Main{
    private transport: Transport;
    private messageHandler: MessageHandler;
    private twinHandler: TwinHandler;
    private methodHandler: MethodHandler;
    public onConnected: any;
    public onDisconnected: any;

    constructor(connectionString: string,keepAlive: number) {
        this.transport = new Transport(connectionString,keepAlive);
        this.messageHandler = new MessageHandler(this.transport,null);
        this.twinHandler = new TwinHandler(this.transport,null);
        this.methodHandler = new MethodHandler(this.transport,null);
    }

    public connect() {
        this.transport.connect(this.onConnected, this.onDisconnected);
        this.messageHandler.initialize();
        this.twinHandler.initialize();
        this.methodHandler.initialize();
    }

    public disconnect() {
        this.messageHandler.uninitialize();
        this.twinHandler.uninitialize();
        this.methodHandler.uninitialize();
        this.transport.disconnect();
    }
}