import { WebSocketAdaptor } from '../../';
import { EventEmitter } from 'events';
import { vi } from 'vitest';

class MockWebSocket extends EventEmitter implements WebSocket {
	public url: string;
	public readyState: number;
	public send: vi.Mock;
	public close: vi.Mock;

	readonly CONNECTING: 0;
	readonly OPEN: 1;
	readonly CLOSING: 2;
	readonly CLOSED: 3;

	public binaryType: BinaryType = 'arraybuffer';
	public bufferedAmount = 0;
	public extensions = '';
	public onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
	public onerror: ((this: WebSocket, ev: Event) => any) | null = null;
	public onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
	public onopen: ((this: WebSocket, ev: Event) => any) | null = null;
	public protocol = '';

	constructor(url: string) {
		super();
		this.url = url;
        this.CONNECTING = 0;
		this.OPEN = 1;
		this.CLOSING = 2;
		this.CLOSED = 3;
		this.readyState = this.CONNECTING;
		this.send = vi.fn();
		this.close = vi.fn();
	}

	public triggerEvent(name: string, ...args: any[]) {
		this.emit(name, ...args);
		if (typeof (this as any)['on' + name] === 'function') {
			(this as any)['on' + name].apply(this, args);
		}
	}

	public addEventListener<K extends keyof WebSocketEventMap>(
		type: K,
		listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions
	): void {
		super.addListener(type, listener);
	}

	public removeEventListener<K extends keyof WebSocketEventMap>(
		type: K,
		listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
		options?: boolean | EventListenerOptions
	): void {
		super.removeListener(type, listener);
	}

	public dispatchEvent(event: Event): boolean {
		return this.emit(event.type, event);
	}
}

class MockProtocol extends EventEmitter {
    public start: vi.Mock;
    public stop: vi.Mock;
    public handleMessage: vi.Mock;
    public isStarted: vi.Mock;

    constructor() {
        super();
        this.start = vi.fn();
        this.stop = vi.fn();
        this.handleMessage = vi.fn();
        this.isStarted = vi.fn();
    }
}

class ThrowingMockProtocol extends EventEmitter {
    public start: vi.Mock;
    public stop: vi.Mock;
    public handleMessage: vi.Mock;
    public isStarted: vi.Mock;

    constructor() {
        super();
        this.start = vi.fn();
        this.stop = vi.fn();
        this.isStarted = vi.fn();
        this.handleMessage = vi.fn(() => {
            throw new Error("mock error in message handler");
        });
    }
}

describe("WebSocketAdaptor", () => {
    let ws: MockWebSocket;
    let protocol: MockProtocol;
    let throwingProtocol: ThrowingMockProtocol;

    beforeEach(() => {
        ws = new MockWebSocket("ws://127.0.0.1");
        protocol = new MockProtocol();
        throwingProtocol = new ThrowingMockProtocol();
    });

    it("exists", () => {
        expect(WebSocketAdaptor).toBeDefined();
    });

    it("calls start() on the protocol handler if websocket if it is in state OPEN", () => {
        ws.readyState = ws.OPEN;
        const wsa = new WebSocketAdaptor(protocol, ws as any);
        expect(protocol.start).toHaveBeenCalled();
    });

    it("does not call start() on the protocol handler if websocket if it is in state CONNECTING", () => {
        ws.readyState = ws.CONNECTING;
        const wsa = new WebSocketAdaptor(protocol, ws as any);
        expect(protocol.start).not.toHaveBeenCalled();
    });

    it("does not call start() on the protocol handler if websocket if it is in state CLOSING", () => {
        ws.readyState = ws.CLOSING;
        const wsa = new WebSocketAdaptor(protocol, ws as any);
        expect(protocol.start).not.toHaveBeenCalled();
    });

    it("does not call start() on the protocol handler if websocket if it is in state CLOSED", () => {
        ws.readyState = ws.CLOSED;
        const wsa = new WebSocketAdaptor(protocol, ws as any);
        expect(protocol.start).not.toHaveBeenCalled();
    });

    it("does call start when the websocket transitions from CONNECTING to OPEN", () => {
        ws.readyState = ws.CONNECTING;
        const wsa = new WebSocketAdaptor(protocol, ws as any);
        expect(protocol.start).not.toHaveBeenCalled();
        ws.readyState = ws.OPEN;
        ws.triggerEvent("open", {});
        expect(protocol.start).toHaveBeenCalled();
    });

    it("does call start when the websocket transitions from CLOSED to OPEN (to support some 'reconnecting' websocket implementations)", () => {
        ws.readyState = ws.CLOSED;
        const wsa = new WebSocketAdaptor(protocol, ws as any);
        expect(protocol.start).not.toHaveBeenCalled();
        ws.readyState = ws.OPEN;
        ws.triggerEvent("open", {});
        expect(protocol.start).toHaveBeenCalled();
    });

    it("does call stop when the websocket transitions from OPEN to CLOSED", () => {
        ws.readyState = ws.OPEN;
        const wsa = new WebSocketAdaptor(protocol, ws as any);
        expect(protocol.stop).not.toHaveBeenCalled();
        ws.readyState = ws.CLOSED;
        ws.triggerEvent("close", {});
        expect(protocol.stop).toHaveBeenCalled();
    });

    it("calls handleMessage on the protocol handler when the websocket receives a message, passing the payload and null routing information", () => {
        const payload = "foo";
        ws.readyState = ws.OPEN;
        const wsa = new WebSocketAdaptor(protocol, ws as any);
        const event = { data: payload, origin: ws.url };
        ws.triggerEvent("message", event);
        expect(protocol.handleMessage).toHaveBeenCalledWith(payload, null);
    });

    it("calls send on the websocket when it receives a send event from the protocol handler, to pass on the payload", () => {
        const payload = "baa";
        ws.readyState = ws.OPEN;
        const wsa = new WebSocketAdaptor(protocol, ws as any);
        protocol.emit("send", payload);
        expect(ws.send).toHaveBeenCalledWith(payload);
    });

    it("ignores an open event on the websocket after stop() is called, and therefore does not call start() on the protocol handler", () => {
        ws.readyState = ws.CONNECTING;
        const wsa = new WebSocketAdaptor(protocol, ws as any);
        wsa.stop();
        ws.readyState = ws.OPEN;
        ws.triggerEvent("open", {});
        expect(protocol.start).not.toHaveBeenCalled();
    });

    it("ignores a received message on the websocket after stop() is called, and therefore does not call handleMessage() on the protocol handler", () => {
        const payload = "flrob";
        ws.readyState = ws.OPEN;
        const wsa = new WebSocketAdaptor(protocol, ws as any);
        wsa.stop();
        const event = { data: payload, origin: ws.url };
        ws.triggerEvent("message", event);
        expect(protocol.handleMessage).not.toHaveBeenCalled();
    });

    it("calls stop() on the protocol handler when stop() is called, but ignores a close event on the websocket after stop() is called, and therefore does not call stop() on the protocol handler", () => {
        ws.readyState = ws.OPEN;
        const wsa = new WebSocketAdaptor(protocol, ws as any);
        wsa.stop();
        expect(protocol.stop).toHaveBeenCalled();
        protocol.stop.mockClear();
        ws.triggerEvent("close", {});
        expect(protocol.stop).not.toHaveBeenCalled();
    });

    it("catches error in the protocol message handler", () => {
        const payload = "foobar";
        ws.readyState = ws.OPEN;
        const wsa = new WebSocketAdaptor(throwingProtocol, ws as any);
        const event = { data: payload, origin: ws.url };
        expect(() => {
            ws.triggerEvent("message", event);
        }).not.toThrow();
        expect(throwingProtocol.handleMessage).toHaveBeenCalledWith(payload, null);
    });
});
