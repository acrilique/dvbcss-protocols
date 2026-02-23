# DVB-CSS Protocols

A TypeScript library implementing client and server protocols for synchronisation between TVs and companion screen applications, using the protocols specified by [DVB CSS](http://www.etsi.org/standards-search?search=103+286&page=1&title=1&keywords=1&ed=1&sortby=1) / [HbbTV 2](http://hbbtv.org/resource-library/).

This library has similarities to the protocol components in [pydvbcss](https://github.com/bbc/pydvbcss) and uses some similar patterns.

> [!NOTE]
> This is a TypeScript + ESM rewrite of the original [dvbcss-protocols](https://github.com/bbc/dvbcss-protocols) and [dvbcss-clocks](https://github.com/bbc/dvbcss-clocks) libraries developed by the BBC. The original libraries were written in ES5 with CommonJS modules. This version is structured as a [pnpm workspace](https://pnpm.io/workspaces) monorepo with separate packages for clocks, Node.js and browser environments.

## Packages

| Package | Description |
|---|---|
| [`@iimrd/dvbcss-clocks`](packages/dvbcss-clocks) | Clock hierarchy classes for modelling timelines and their relationships |
| [`@iimrd/dvbcss-node`](packages/dvbcss-node) | DVB-CSS protocol implementations for Node.js (UDP + WebSocket) |
| [`@iimrd/dvbcss-browser`](packages/dvbcss-browser) | Browser-specific transports (WebSocket + MessagePort) |

### Feature matrix

| Feature | `dvbcss-node` | `dvbcss-browser` |
|---|:---:|:---:|
| CII client (WebSocket) | YES | YES |
| TS client (WebSocket) | YES | YES |
| WC client (UDP) | YES | |
| WC client (WebSocket) | YES | YES |
| WC client (MessagePort) | | YES |
| WC server (UDP) | YES | |
| WC server (WebSocket) | YES | |
| CII client (MessagePort) | | YES |
| TS client (MessagePort) | | YES |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9

### Install and build

```sh
git clone https://github.com/IIMrd/dvbcss-protocols.git
cd dvbcss-protocols
pnpm install
pnpm build
```

### Use in your own project

Install the package(s) you need:

```sh
# For Node.js applications
pnpm add @iimrd/dvbcss-clocks @iimrd/dvbcss-node

# For browser applications
pnpm add @iimrd/dvbcss-clocks @iimrd/dvbcss-browser
```

### Run the examples

There are examples of clients and servers in the [`examples/`](examples/) directory:

```sh
node examples/wallClockClient.js --help
node examples/wallClockServer.js --help
```

## Quick example

Creating a Wall Clock client using JSON messages over a WebSocket connection:

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

## Documentation

API documentation is generated with [TypeDoc](https://typedoc.org/):

```sh
pnpm doc
```

Output is written to the `docs/` directory.

## Tests

Unit tests use [Vitest](https://vitest.dev/):

```sh
pnpm test
```

## Super-quick introduction to the protocols

DVB has defined 3 protocols for communicating between a companion and TV in
order to create synchronised second screen / dual screen / companion experiences:

- **CSS-CII** — A WebSocket + JSON protocol that conveys state from the TV, such as
  the ID of the content being shown at the time. It also carries the URLs to
  connect to the other two protocols.

- **CSS-WC** — A simple UDP protocol (like NTP but simplified) that establishes a
  common shared clock (a "wall clock") between the TV and companion, compensating
  for network delays.

- **CSS-TS** — Another WebSocket + JSON protocol that communicates timestamps from
  TV to Companion that describe the current timeline position.

The TV implements servers for all 3 protocols. The Companion implements clients.

There are other protocols defined in the specification (CSS-TE and CSS-MRS) that
are not currently implemented by this library.

## Architecture

```
┌───────────────────┐
│  dvbcss-clocks    │  Clock hierarchy: DateNowClock → CorrelatedClock → OffsetClock
└────────┬──────────┘
         │ depends on
┌────────▼──────────┐
│  dvbcss-node      │  Protocol handlers (CSS-WC, CSS-CII, CSS-TS)
│                   │  + Socket adaptors (UDP, WebSocket)
└────────┬──────────┘
         │ re-exports + extends
┌────────▼──────────┐
│  dvbcss-browser   │  MessagePort transport for browser / TWA environments
└───────────────────┘
```

## Licence and Authors

All code and documentation is licensed by the original author and contributors under the Apache License v2.0:

- [British Broadcasting Corporation](http://www.bbc.co.uk/rd) (original author)
- [Institut für Rundfunktechnik](http://www.irt.de/)
- [British Telecommunications (BT) PLC](http://www.bt.com/)

See the [AUTHORS](AUTHORS) file for a full list of individuals and organisations that have contributed to this code.

<img src="https://2immerse.eu/wp-content/uploads/2016/04/2-IMM_150x50.png" align="left"/><em>This project was originally developed as part of the <a href="https://2immerse.eu/">2-IMMERSE</a> project, co-funded by the European Commission's <a href="http://ec.europa.eu/programmes/horizon2020/">Horizon 2020</a> Research Programme</em>

<br clear="left"/>

## Contributing

If you wish to contribute to this project, please get in touch with the authors.
