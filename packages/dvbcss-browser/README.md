# @iimrd/dvbcss-browser

Browser-specific transports for the DVB-CSS synchronisation protocols. Provides `MessagePort`-based adaptors for use in browser environments and Trusted Web Activities (TWAs), alongside re-exported WebSocket-based protocol implementations from `@iimrd/dvbcss-node`.

This package is part of the [`@iimrd/dvbcss-protocols`](https://github.com/IIMrd/dvbcss-protocols) monorepo.

## Installation

```sh
pnpm add @iimrd/dvbcss-browser @iimrd/dvbcss-clocks
```

## Feature support

| Feature | Transport |
|---|---|
| CII client | WebSocket, MessagePort |
| TS client | WebSocket, MessagePort |
| WC client | WebSocket (JSON), MessagePort (binary) |

## API overview

This package re-exports everything from `@iimrd/dvbcss-node` except `UdpAdaptor` (UDP is not available in browsers), plus the following browser-specific additions:

| Export | Description |
|---|---|
| `MessagePortAdaptor` | `SocketAdaptor` implementation for [`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) (e.g. `MessageChannel` or TWA bridge). |
| `createBinaryMessagePortWCClient` | Creates a Wall Clock client over a `MessagePort` using binary encoding. |
| `createMessagePortCIIClient` | Creates a CII client over a `MessagePort` with JSON encoding. Returns an `AdaptorWrapper`. |
| `createMessagePortTSClient` | Creates a TS client over a `MessagePort` with JSON encoding. |

## Quick example

### Wall Clock client over MessagePort

```ts
import { DateNowClock, CorrelatedClock } from "@iimrd/dvbcss-clocks";
import { createBinaryMessagePortWCClient } from "@iimrd/dvbcss-browser";

const root = new DateNowClock();
const wallClock = new CorrelatedClock(root);

// messagePort could come from a MessageChannel, a TWA bridge, etc.
const wcClient = createBinaryMessagePortWCClient(messagePort, wallClock);
```

### CII client over MessagePort

```ts
import { createMessagePortCIIClient } from "@iimrd/dvbcss-browser";

const ciiClient = createMessagePortCIIClient(messagePort);

ciiClient.on("change", (cii, changemask) => {
  console.log("CII state changed:", cii);
});
```

### TS client over MessagePort

```ts
import { CorrelatedClock } from "@iimrd/dvbcss-clocks";
import { createMessagePortTSClient } from "@iimrd/dvbcss-browser";

// wallClock should already be synchronised via a WC client
const syncTLClock = new CorrelatedClock(wallClock);

const tsClient = createMessagePortTSClient(messagePort, syncTLClock, {
  contentIdStem: "dvb://",
  timelineSelector: "urn:dvb:css:timeline:pts",
});
```

### WebSocket-based clients (also available)

All WebSocket-based factories from `@iimrd/dvbcss-node` are re-exported, so you can also use them directly:

```ts
import { createJsonWebSocketClient, createCIIClient, createTSClient } from "@iimrd/dvbcss-browser";
```

## Licence and Authors

All code and documentation is licensed by the original author and contributors under the Apache License v2.0:

- [British Broadcasting Corporation](http://www.bbc.co.uk/rd) (original author)
- [Institut für Rundfunktechnik](http://www.irt.de/)
- [British Telecommunications (BT) PLC](http://www.bt.com/)

See the [AUTHORS](../../AUTHORS) file for a full list of individuals and organisations that have contributed to this code.
