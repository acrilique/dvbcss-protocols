This library is designed to be modular and allow protocols (clients/servers)
to be separated from on-the-wire message formats (Json/Binary etc)
and the type of network transport (UDP/Websockets etc).

This approach has been used for the WallClock protocol and partially used for the  Timeline
Synchronisation protocol. It has not been done for the CII protocol.

## Protocol Handlers, Socket Adaptors, Serialisers



<div style="text-align:center;">
    <img src="https://bbc.github.io/dvbcss-protocols/protocol-handler-architecture.png" style="width:80%; min-width: 25em; max-width: 45em;">
</div>

A [Protocol Handler]( ../packages/dvbcss-node/src/INTERFACES/ProtocolHandler.ts) implements the protocol interaction. They receive and send messages via a [Socket Adaptor](../packages/dvbcss-node/src/INTERFACES/SocketAdaptor.ts) that abstracts the underlying network connection.

The Socket Adaptor calls [start()](../packages/dvbcss-node/src/INTERFACES/ProtocolHandler.ts#start) and [stop()](../packages/dvbcss-node/src/INTERFACES/ProtocolHandler.ts#stop) methods when the connection opens or closes.

Messages are received by the adaptor calling a [handleMessage()](../packages/dvbcss-node/src/INTERFACES/ProtocolHandler.ts#handleMessage) method
and messages are sent by the Protocol Handler emitting a [send event](../packages/dvbcss-node/src/INTERFACES/ProtocolHandler.ts#event:send).

A Protocol Handler also uses a [Protocol Serialiser](../packages/dvbcss-node/src/INTERFACES/ProtocolSerialiser.ts).
This is a static object with [pack()](../packages/dvbcss-node/src/INTERFACES/ProtocolSerialiser.ts#pack) and [unpack()](../packages/dvbcss-node/src/INTERFACES/ProtocolSerialiser.ts#unpack) static methods for converting messages to/from
the on-the-wire format.

This approach allows for a single protocol implementation that can use a variety
of formats for the on-the-wire message (e.g. binary formats, JSON, etc) and
where the messages can be transported across a variety of transport protocols
(e.g. UDP, WebSockets).

To simplify usage, `createXXXX()` helper functions are provided that construct the most common
combinations of socket adaptor, protocol handler and serialisation.


### Example: Wall Clock Protocol client

[WallClockClientProtocol](../packages/dvbcss-node/src/WallClock/WallClockClientProtocol.ts)
is an example of a protocol handler for a Wallclock Protocol client.

It has a handler function that is called when a message is received, and it
emits a [send event](../packages/dvbcss-node/src/INTERFACES/ProtocolHandler.ts#event:send) to request a message be sent.

For this protocol, there are two serialisers available for *packing*/*unpacking*
on-the-wire formats:

* The [BinarySerialiser](../packages/dvbcss-node/src/WallClock/BinarySerialiser.ts) packs/unpacks to the binary format used in [DVB CSS](http://etsi.org/deliver/etsi_ts/103200_103299/10328602/01.01.01_60/ts_10328602v010101p.pdf)
* The [JsonSerialiser](../packages/dvbcss-node/src/WallClock/JsonSerialiser.ts) packs/unpacks to a JSON format



Adaptors encapsulate the underlying network connection (represented usually by
some kind of 'socket' object) and the Protocol Handler. They notify the handler of
received messages and they listen for the 'send' events.

* `Protocols.SocketAdapators.UdpAdaptor` - for node.js UDP [dgram](https://nodejs.org/api/dgram.html) object
* `Protocols.SocketAdaptors.WebSocketAdaptor` - for any [W3C WebSocket API](https://www.w3.org/TR/websockets/) compliant object
