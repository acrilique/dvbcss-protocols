import { UdpAdaptor } from '../../src/SocketAdaptors/UdpAdaptor.js';
import { ProtocolHandler } from '../../src/INTERFACES/ProtocolHandler.js';
import { EventEmitter } from 'events';
import { RemoteInfo, Socket } from 'dgram';

class MockDgramSocket extends EventEmitter {
	public send: vi.Mock;

	constructor() {
		super();
		this.send = vi.fn();
	}
}

class MockProtocol extends EventEmitter implements ProtocolHandler {
	public start: vi.Mock;
	public stop: vi.Mock;
    public isStarted: vi.Mock;
	public handleMessage: vi.Mock;

	constructor() {
		super();
		this.start = vi.fn();
		this.stop = vi.fn();
		this.isStarted = vi.fn();
		this.handleMessage = vi.fn();
	}
}

describe('UdpAdaptor', () => {
	let sock: MockDgramSocket;
	let protocol: MockProtocol;

	beforeEach(() => {
		sock = new MockDgramSocket();
		protocol = new MockProtocol();
	});

	it('exists', () => {
		expect(UdpAdaptor).toBeDefined();
	});

	it('calls start() on the protocol handler', () => {
		new UdpAdaptor(protocol, sock as unknown as Socket);
		expect(protocol.start).toHaveBeenCalled();
	});

	it('does call stop when the socket is closed', () => {
		new UdpAdaptor(protocol, sock as unknown as Socket);
		expect(protocol.stop).not.toHaveBeenCalled();
		sock.emit('close', {});
		expect(protocol.stop).toHaveBeenCalled();
	});

	it('calls handleMessage on the protocol handler when the socket receives a message, passing the payload and routing information, with the payload converted to a Uint8Array', () => {
		const payload = 'foo';
		const rinfo: RemoteInfo = { address: '1.2.3.4', port: 5678, family: 'IPv4', size: payload.length };
		const payloadExpected = new Uint8Array(Buffer.from(payload)).buffer;

		const udpa = new UdpAdaptor(protocol, sock as unknown as Socket);

		sock.emit('message', payload, rinfo);
		expect(protocol.handleMessage).toHaveBeenCalledWith(payloadExpected, rinfo);
	});

	it('calls send on the dgram socket when it receives a send event from the protocol handler, to pass on the payload as a buffer object', () => {
		const payload = 'baa';
		const rinfo: RemoteInfo = { address: '1.2.3.4', port: 5678, family: 'IPv4', size: payload.length };
		const payloadExpected = Buffer.from('baa');

		new UdpAdaptor(protocol, sock as unknown as Socket);

		protocol.emit('send', payload, rinfo);
		expect(sock.send).toHaveBeenCalledWith(
			payloadExpected,
			0,
			payloadExpected.length,
			rinfo.port,
			rinfo.address
		);
	});

	it('ignores a received message on the socket after stop() is called, and therefore does not call handleMessage() on the protocol handler', () => {
		const payload = 'flrob';
		const rinfo: RemoteInfo = { address: '1.2.3.4', port: 5678, family: 'IPv4', size: payload.length };

		const udpa = new UdpAdaptor(protocol, sock as unknown as Socket);
		udpa.stop();
		sock.emit('message', payload, rinfo);
		expect(protocol.handleMessage).not.toHaveBeenCalled();
	});

	it('calls stop() on the protocol handler when stop() is called, but ignores a close event on the socket after stop() is called, and therefore does not call stop() on the protocol handler', () => {
		const udpa = new UdpAdaptor(protocol, sock as unknown as Socket);
		udpa.stop();
		expect(protocol.stop).toHaveBeenCalled();
		(protocol.stop as vi.Mock).mockClear();
		sock.emit('close', {});
		expect(protocol.stop).not.toHaveBeenCalled();
	});
});
