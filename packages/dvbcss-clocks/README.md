# @iimrd/dvbcss-clocks

TypeScript classes for representing clocks and timelines and their relationships to each other. Useful in event-driven real-time applications to drive and track the progress of time, such as synchronised companion screen applications based on [DVB CSS](http://www.etsi.org/standards-search?search=103+286&page=1&title=1&keywords=1&ed=1&sortby=1) / [HbbTV 2](http://hbbtv.org/resource-library/).

This package is part of the [`@iimrd/dvbcss-protocols`](https://github.com/IIMrd/dvbcss-protocols) monorepo.

> [!NOTE]
> This is a TypeScript + ESM rewrite of the original [dvbcss-clocks](https://github.com/bbc/dvbcss-clocks) library developed by the BBC.

## Installation

```sh
pnpm add @iimrd/dvbcss-clocks
```

## API overview

| Export | Description |
|---|---|
| `ClockBase` | Abstract base class for all clocks. Extends `EventEmitter`. Manages parent-child relationships and emits `change` / `available` / `unavailable` events. |
| `DateNowClock` | Root clock backed by `Date.now()`. Options: `tickRate`, `maxFreqErrorPpm`. |
| `CorrelatedClock` | Clock whose time is derived from a parent via a `Correlation`. Options: `tickRate`, `speed`, `correlation`. |
| `Correlation` | Immutable value object mapping a point on a parent clock to a point on a child clock, with optional error bounds. |
| `OffsetClock` | Applies a fixed time offset to its parent clock (e.g. for render-latency compensation). |
| `measurePrecision` | Utility function that empirically measures the minimum observable tick of a time source. |

## Quick overview

Clock objects form a hierarchy and are used to represent how one sense of time relates to another — e.g. how a timeline for media playback relates to real world time.

```ts
import {
  DateNowClock,
  Correlation,
  CorrelatedClock,
} from "@iimrd/dvbcss-clocks";
```

A `DateNowClock` is a root clock wrapping system time from `Date.now()`:

```ts
const rootClock = new DateNowClock({ tickRate: 1000, maxFreqErrorPpm: 50 });
console.log(rootClock.now());
```

Build a hierarchy using `CorrelatedClock` objects where a `Correlation` describes the relationship between a clock and its parent:

```ts
const corr = new Correlation(5000, 0);
const wallClock = new CorrelatedClock(rootClock, {
  tickRate: 50,
  correlation: corr,
});
```

This clock has 50 ticks/second. The correlation means that when `rootClock` is at time position 5000, `wallClock` is at position 0. Querying the position of this clock calculates a value from its parent by extrapolating from the correlation and converting tick rates:

```ts
console.log(rootClock.now(), wallClock.now());
// e.g. 5000, 0
//      5200, 10
//      5215, 10.75
```

Add another clock to the chain — for example, a video timeline starting from zero right now:

```ts
const videoTimeline = new CorrelatedClock(wallClock, {
  tickRate: 25,
  correlation: new Correlation(wallClock.now(), 0),
});
```

Listen for events — changes propagate down the hierarchy:

```ts
videoTimeline.on("change", () => console.log("Video timeline changed"));
videoTimeline.on("available", () => console.log("Video timeline available"));
videoTimeline.on("unavailable", () => console.log("Video timeline unavailable"));
```

Modify clock properties. This triggers `change` events on all descendant clocks:

```ts
wallClock.correlation = new Correlation(rootClock.now(), 0);
wallClock.speed = 2.0;
wallClock.availabilityFlag = false;
wallClock.availabilityFlag = true;
```

Schedule callbacks tied to a clock's timeline:

```ts
videoTimeline.setAtTime(() => console.log("Time to stop video"), 500);
```

This callback fires when `videoTimeline` reaches (or jumps past) time position 500, even if correlations change in the meantime.

Clocks can be built into arbitrarily complex hierarchies and reconfigured dynamically. There are helper methods for converting time values between clocks, and ways to annotate clocks with quantified uncertainty bounds (dispersions) that are tracked by their descendants.

## Tests

```sh
pnpm test
```

## Licence and Authors

All code and documentation is licensed by the original author and contributors under the Apache License v2.0:

- [British Broadcasting Corporation](http://www.bbc.co.uk/rd) (original author)
- [British Telecommunications (BT) PLC](http://www.bt.com/)

See the [AUTHORS](../../AUTHORS) file for a full list of individuals and organisations that have contributed to this code.
