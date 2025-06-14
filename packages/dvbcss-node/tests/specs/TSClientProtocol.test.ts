import { WebSocketAdaptor, TSClientProtocol, TSSetupMessage, ControlTimestamp } from '../../';
import { CorrelatedClock, DateNowClock } from 'dvbcss-clocks';
import { EventEmitter } from 'events';
import { vi } from 'vitest';

class MockWebSocket extends EventEmitter implements WebSocket {
	public url: string;
	readonly CONNECTING: 0;
	readonly OPEN: 1;
	readonly CLOSING: 2;
	readonly CLOSED: 3;
	public readyState: number;
	public send: vi.Mock;
	public close: vi.Mock;

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

const MockClock = () => {
	const clock = new CorrelatedClock(new DateNowClock(), { tickRate: 2000 });
	clock.availabilityFlag = false;
	return clock;
};

describe('TSClientProtocol', () => {
	let ws: MockWebSocket;
	let clock: CorrelatedClock;
	const options = { timelineSelector: 'urn:', contentIdStem: 'http://myserver.org/myvideo.mp4', tickrate: 2000 };

	beforeEach(() => {
		ws = new MockWebSocket('ws://127.0.0.1');
		clock = MockClock();
	});

	it('exists', () => {
		expect(TSClientProtocol).toBeDefined();
	});

	it('can be instantiated.', () => {
		const setAvailabilityFlagSpy = vi.spyOn(clock, 'setAvailabilityFlag');
		const tscp = new TSClientProtocol(clock, options);

		expect(tscp).toBeDefined();
		expect(setAvailabilityFlagSpy).toHaveBeenCalled();
	});

	it('sends setup message when start is called from WebSocketAdaptor.', () => {
		const tscp = new TSClientProtocol(clock, options);
		new WebSocketAdaptor(tscp, ws);

		ws.triggerEvent('open', {});
		expect(ws.send).toHaveBeenCalledWith(new TSSetupMessage(options.contentIdStem, options.timelineSelector).serialise(), {
			binary: false,
		});
	});

	it('initialises the CorrelatedClock object when it receives the first control timestamp.', () => {
		const setCorrelationAndSpeedSpy = vi.spyOn(clock, 'setCorrelationAndSpeed');
		vi.spyOn(clock, 'isChangeSignificant');
		const setAvailabilityFlagSpy = vi.spyOn(clock, 'setAvailabilityFlag');

		const tscp = new TSClientProtocol(clock, options);
		new WebSocketAdaptor(tscp, ws);
		const cts = new ControlTimestamp(1, 2, 1.0);

		ws.triggerEvent('message', { data: cts.serialise() });

		expect(setAvailabilityFlagSpy).toHaveBeenCalledWith(true);
		expect(setCorrelationAndSpeedSpy).toHaveBeenCalled();
	});

	it('updates the CorrelatedClock object when it receives a control timestamp with a significant change.', () => {
		vi.spyOn(clock, 'isChangeSignificant');
		const setAvailabilityFlagSpy = vi.spyOn(clock, 'setAvailabilityFlag');

		const tscp = new TSClientProtocol(clock, options);
		new WebSocketAdaptor(tscp, ws);
		const cts1 = new ControlTimestamp(1, 2, 1.0);
		const cts2 = new ControlTimestamp(2000000, 2, 1.0);

		ws.triggerEvent('message', { data: cts1.serialise() });
		const setCorrelationAndSpeedSpy = vi.spyOn(clock, 'setCorrelationAndSpeed');
		ws.triggerEvent('message', { data: cts2.serialise() });

		expect(clock.isChangeSignificant).toHaveBeenCalled();
		expect(setAvailabilityFlagSpy).toHaveBeenCalledWith(true);
		expect(setCorrelationAndSpeedSpy).toHaveBeenCalled();
	});
});
