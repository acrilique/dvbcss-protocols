# @iimrd/dvbcss-node

Node.js implementations of the DVB-CSS synchronisation protocols: CSS-WC (Wall Clock), CSS-CII (Content Identification & Information), and CSS-TS (Timeline Synchronisation).

This package is part of the [`@iimrd/dvbcss-protocols`](https://github.com/IIMrd/dvbcss-protocols) monorepo.

> [!NOTE]
> This is a TypeScript + ESM rewrite of the protocol components from the original [dvbcss-protocols](https://github.com/bbc/dvbcss-protocols) library developed by the BBC.

## Installation

```sh
pnpm add @iimrd/dvbcss-node @iimrd/dvbcss-clocks
```

## Feature support

| Feature | Supported |
|---|:---:|
| CII client (WebSocket) | YES |
| TS client (WebSocket) | YES |
| WC client (UDP / WebSocket / JSON) | YES |
| WC server (UDP / WebSocket) | YES |

## API overview

### Interfaces

| Export | Description |
|---|---|
| `ProtocolHandler` | Core abstraction: `start()`, `stop()`, `handleMessage()`. Extends `EventEmitter`, emits `"send"` events. |
| `ProtocolSerialiser` | Wire-format codec: `pack()` / `unpack()`. |
| `SocketAdaptor` | Glue between a network connection and a `ProtocolHandler`. |

### Socket Adaptors

| Export | Description |
|---|---|
| `UdpAdaptor` | Wraps a Node.js `dgram.Socket` for use with a `ProtocolHandler`. |
| `WebSocketAdaptor` | Wraps a `WebSocket` for use with a `ProtocolHandler`. |

### Wall Clock (CSS-WC)

| Export | Description |
|---|---|
| `WallClockClientProtocol` | Client-side WC handler. Sends periodic requests, processes responses, selects best candidate, and updates a `CorrelatedClock`. |
| `WallClockServerProtocol` | Server-side WC handler. Responds to requests with timestamps; supports follow-up messages. |
| `WallClockMessage` | Full WC message representation (version, type, timestamps, precision, etc.). |
| `WallClockMessageTypes` | Enum: `request`, `response`, `responseWithFollowUp`, `followUp`. |
| `Candidate` | A measurement candidate derived from a WC response, with methods to compute offset and dispersion. |
| `BinarySerialiser` | Packs/unpacks the 32-byte binary format per ETSI TS 103 286-2. |
| `JsonSerialiser` | JSON encoding for WC messages (for use over WebSocket). |
| `createWallClockClient` | Generic factory to create a WC client with any adaptor + serialiser. |
| `createJsonWebSocketClient` | Convenience factory: WC client over WebSocket with JSON encoding. |

### CII (CSS-CII)

| Export | Description |
|---|---|
| `CIIClientProtocol` | Client-side CII handler. Tracks incoming CII state and emits `"change"` events. |
| `CIIMessage` | Represents the full CII state: `protocolVersion`, `contentId`, `wcUrl`, `tsUrl`, `timelines`, etc. |
| `TimelineProperties` | Describes an available timeline: `timelineSelector`, `unitsPerTick`, `unitsPerSecond`. |
| `createCIIClient` | Convenience factory: wires up a `WebSocketAdaptor` + `CIIClientProtocol`. |
| `AdaptorWrapper` | EventEmitter wrapper returned by factory functions; re-emits protocol events. |

### Timeline Synchronisation (CSS-TS)

| Export | Description |
|---|---|
| `TSClientProtocol` | Client-side TS handler. Sends a setup message, receives `ControlTimestamp` updates, and adjusts a `CorrelatedClock`. |
| `TSSetupMessage` | Initial handshake message: `contentIdStem` + `timelineSelector`. |
| `ControlTimestamp` | Server-to-client update: `contentTime`, `wallClockTime`, `timelineSpeedMultiplier`. |
| `PresentationTimestamp` | A single timestamp pair (content time + wall clock time). |
| `PresentationTimestamps` | Aggregates `earliest`, `latest`, and optional `actual` timestamps (client-to-server feedback). |
| `createTSClient` | Convenience factory: wires up a `WebSocketAdaptor` + `TSClientProtocol`. |

## Quick example

### Wall Clock client (JSON over WebSocket)

```ts
import { WebSocket } from "ws";
import { DateNowClock, CorrelatedClock } from "@iimrd/dvbcss-clocks";
import { createJsonWebSocketClient } from "@iimrd/dvbcss-node";

const ws = new WebSocket("ws://127.0.0.1:7681/wall-clock-server");

const root = new DateNowClock();
const wallClock = new CorrelatedClock(root);

const wcClient = createJsonWebSocketClient(ws, wallClock);

// Later, close the WebSocket to stop the client:
ws.close();
```

### CII client

```ts
import { WebSocket } from "ws";
import { createCIIClient, CIIMessage } from "@iimrd/dvbcss-node";

const ws = new WebSocket("ws://tv-address/cii");
const ciiClient = createCIIClient(ws);

ciiClient.on("change", (cii: CIIMessage, changemask: number) => {
  console.log("CII state changed:", cii);
});
```

### TS client

```ts
import { WebSocket } from "ws";
import { CorrelatedClock } from "@iimrd/dvbcss-clocks";
import { createTSClient } from "@iimrd/dvbcss-node";

// wallClock should already be synchronised via a WC client
const syncTLClock = new CorrelatedClock(wallClock);

const ws = new WebSocket("ws://tv-address/ts");
const tsClient = createTSClient(ws, syncTLClock, {
  contentIdStem: "dvb://",
  timelineSelector: "urn:dvb:css:timeline:pts",
});
```

## Tests

```sh
pnpm test
```

## Licence and Authors

All code and documentation is licensed by the original author and contributors under the Apache License v2.0:

- [British Broadcasting Corporation](http://www.bbc.co.uk/rd) (original author)
- [Institut für Rundfunktechnik](http://www.irt.de/)
- [British Telecommunications (BT) PLC](http://www.bt.com/)

See the [AUTHORS](../../AUTHORS) file for a full list of individuals and organisations that have contributed to this code.
