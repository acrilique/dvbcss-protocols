/****************************************************************************
 * Copyright 2017 British Broadcasting Corporation
 * and contributions Copyright 2017 British Telecommunications (BT) PLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * --------------------------------------------------------------------------
 * Summary of parts containing contributions
 *   by British Telecommunications (BT) PLC:
 *     CorrelatedClock.prototype.setAtTime
 *     CorrelatedClock.prototype._rescheduleTimers
 ****************************************************************************/

import { EventEmitter } from "eventemitter3";

let nextIdNum = 0;
let nextTimeoutHandle = 0;

type TimerHandle = string;

interface Timer {
  realHandle?: NodeJS.Timeout;
  when: number;
  callback: () => void;
}

/**
 * @event change
 * There has been a change in the timing of this clock.
 * This might be due to a change made directly to this clock, or a change
 * made to a parent in the hierarchy that affected this clock.
 *
 * <p>Causes of changes to clocks include: changes to
 * [speed]{@link ClockBase#speed},
 * [tick rate]{@link ClockBase#tickRate},
 * [correlation]{@link CorrelatedClock#correlation}, or
 * [parentage]{@link ClockBase#parent}.
 * Changes to availability do not cause this event to fire.
 *
 * @param {ClockBase} source The clock that fired the event.
 */

/**
 * @event available
 * This clock has become available.
 *
 * This might be because [availabilityFlag]{@link ClockBase#availabilityFlag}
 * became true for this clock, or one of its parents in the hierarchy, causing this
 * clock and all its parents to now be flagged as available.
 *
 * @param {ClockBase} source The clock that fired the event.
 */

/**
 * @event unavailable
 * This clock has become unavailable.
 *
 * This might be because [availabilityFlag]{@link ClockBase#availabilityFlag}
 * became false for this clock, or one of its parents in the hierarchy.
 *
 * @param {ClockBase} source The clock that fired the event.
 */

/**
 * @module clocks
 * Abstract Base class for clock implementations.
 *
 * <p>Implementations that can be used are:
 * {@link DateNowClock} and
 * {@link CorrelatedClock}.
 *
 * <p>This is the base class on which other clocks are implemented. It provides
 * the basic framework of properties, getter and setters for common properties
 * such as availability, speed, tick rate and parents, and provides the basic
 * events framework, some standard helper methods for time conversion between clocks, comparisons
 * between clocks and calculating disperison (error/uncertainty).
 *
 * <p>Clocks may fire the following events:
 * <ul>
 *   <li> [change]{@link event:change}
 *   <li> [available]{@link event:available}
 *   <li> [unavailable]{@link event:unavailable}
 * </ul>
 *
 * <p>Clock implementations should inherit from this class and implement some
 * or all of the following method stubs:
 *   [now()]{@link ClockBase#now}
 *   [calcWhen()]{@link ClockBase#calcWhen}
 *   [getTickRate()]{@link ClockBase#getTickRate}
 *   [setTickRate()]{@link ClockBase#setTickRate}
 *   [getSpeed()]{@link ClockBase#getSpeed}
 *   [setSpeed()]{@link ClockBase#setSpeed}
 *   [getParent()]{@link ClockBase#getParent}
 *   [setParent()]{@link ClockBase#setParent}
 *   [toParentTime()]{@link ClockBase#toParentTime}
 *   [fromParentTime()]{@link ClockBase#fromParentTime}
 *   [_errorAtTime()]{@link ClockBase#_errorAtTime}
 *
 * @abstract
 */
export default class ClockBase extends EventEmitter {
  private _availability: boolean;
  /**
   * Every clock instance has a unique ID assigned to it for convenience. This is always of the form "clock_N" where N is a unique number.
   * @type {string}
   */
  public readonly id: string;
  private timerHandles: Record<TimerHandle, Timer>;
  private availablePrev: boolean;

  constructor() {
    super();

    this._availability = true;
    this.id = "clock_" + nextIdNum++;
    this.timerHandles = {};
    this.on('change', this._rescheduleTimers.bind(this));
    this.availablePrev = this._availability;
  }

  /**
   * @returns {number} the current time value of this clock in units of ticks of the clock, or NaN if it cannot be determined (e.g. if the clock is missinga parent)
   * @abstract
   */
  now(): number {
    throw "Unimplemented";
  }

  /**
   * @type {number} The speed at which this clock is running.
   * 1.0 = normal. 0.0 = pause. negative values mean it ticks in reverse.
   *
   * For some implementations this can be changed, as well as read.
   *
   * <p>The underlying implementation of this property uses the
   * [getSpeed]{@link ClockBase#getSpeed} and
   * [setSpeed]{@link ClockBase#setSpeed} methods.
   * @default 1.0
   * @event change
   */
  get speed(): number {
    return this.getSpeed();
  }

  set speed(v: number) {
    this.setSpeed(v);
  }

  /**
   * @type {number} The rate of this clock (in ticks per second).
   *
   * For some implementations this can be changed, as well as read.
   *
   * <p>The underlying implementation of this property uses the
   * [getTickRate]{@link ClockBase#getTickRate} and
   * [setTickRate]{@link ClockBase#setTickRate} methods.
   *
   * @event change
   */
  get tickRate(): number {
    return this.getTickRate();
  }

  set tickRate(v: number) {
    this.setTickRate(v);
  }

  /**
   * @type {ClockBase | null} The parent of this clock, or <tt>null</tt> if it has no parent.
   *
   * For some implementations this can be changed, as well as read.
   *
   * <p>The underlying implementation of this property uses the
   * [getParent]{@link ClockBase#getParent} and
   * [setParent]{@link ClockBase#setParent} methods.
   *
   * @event change
   */
  get parent(): ClockBase | null {
    return this.getParent();
  }

  set parent(v: ClockBase | null) {
    this.setParent(v);
  }

  /**
   * @type {boolean} The availability flag for this clock.
   *
   * For some implementations this can be changed, as well as read.
   *
   * <p>This is only the flag for this clock. Its availability may also be affected
   * by the flags on its parents. To determine true availability, call the
   * [isAvailable]{@link ClockBase#isAvailable} method.
   *
   * <p>The underlying implementation of this property uses the
   * [getAvailabilityFlag]{@link ClockBase#getAvailabilityFlag} and
   * [setAvailabilityFlag]{@link ClockBase#setAvailabilityFlag} methods.
   *
   * @default true
   * @event change
   * @event available
   * @event unavailable
   */
  get availabilityFlag(): boolean {
    return this.getAvailabilityFlag();
  }

  set availabilityFlag(v: boolean) {
    this.setAvailabilityFlag(v);
  }

  /**
   * Returns the current speed of this clock.
   * @returns {number} Speed of this clock.
   * @abstract
   */
  getSpeed(): number {
    return 1.0;
  }

  /**
   * Sets the current speed of this clock, or throws an exception if this is not possible
   * @param {number} newSpeed The new speed for this clock.
   * @abstract
   * @event change
   */
  setSpeed(newSpeed: number): void {
    throw "Unimplemented";
  }

  /**
   * Calculates the effective speed of this clock, taking into account the effects
   * of the speed settings for all of its parents.
   * @returns {number} the effective speed.
   */
  getEffectiveSpeed(): number {
    let s = 1.0;
    let clock: ClockBase | null = this;
    while (clock !== null) {
      s = s * clock.getSpeed();
      clock = clock.getParent();
    }
    return s;
  }

  /**
   * Returns the current tick rate of this clock.
   * @returns {number} Tick rate in ticks/second.
   * @abstract
   */
  getTickRate(): number {
    throw "Unimplemented";
  }

  /**
   * Sets the current tick rate of this clock, or throws an exception if this is not possible.
   * @param {number} newRate New tick rate in ticks/second.
   * @abstract
   * @event change
   */
  setTickRate(newRate: number): void {
    throw "Unimplemented";
  }

  /**
   * Return the current time of this clock but converted to units of nanoseconds, instead of the normal units of the tick rate.
   * @returns {number} current time of this clock in nanoseconds.
   */
  getNanos(): number {
    return this.now() * 1000000000 / this.getTickRate();
  }

  /**
   * Convert a timevalue from nanoseconds to the units of this clock, given its current [tickRate]{@link ClockBase#tickRate}
   * @param {number} nanos in nanoseconds.
   * @returns {number} the supplied time converted to units of its tick rate.
   */
  fromNanos(nanos: number): number {
    return nanos * this.getTickRate() / 1000000000;
  }

  /**
   * Is this clock currently available? Given its availability flag and the availability of its parents.
   * @returns {boolean} True if this clock is available, and all its parents are available; otherwise false.
   */
  isAvailable(): boolean {
    const parent = this.getParent();
    return this._availability && (!parent || parent.isAvailable());
  }

  /**
   * Sets the availability flag for this clock.
   *
   * <p>This is only the flag for this clock. Its availability may also be affected
   * by the flags on its parents. To determine true availability, call the
   * [isAvailable]{@link ClockBase#isAvailable} method.
   *
   * @param {boolean} availability The availability flag for this clock
   * @event unavailable
   * @event available
   */
  setAvailabilityFlag(availability: boolean): void {
    this._availability = availability;
    this.notifyAvailabilityChange();
  }

  /**
   * Cause the "available" or "unavailable" events to fire if availability has
   * changed since last time this method was called. Subclasses should call this
   * to robustly generate "available" or "unavailable" events instead of trying
   * to figure out if there has been a change for themselves.
   * @event unavailable
   * @event available
   */
  notifyAvailabilityChange(): void {
    const availableNow = this.isAvailable();
    if (availableNow !== this.availablePrev) {
      this.availablePrev = availableNow;
      this.emit(availableNow ? "available" : "unavailable", this);
    }
  }

  /**
   * Returns the availability flag for this clock (without taking into account whether its parents are available).
   *
   * <p>This is only the flag for this clock. Its availability may also be affected
   * by the flags on its parents. To determine true availability, call the
   * [isAvailable]{@link ClockBase#isAvailable} method.
   *
   * @returns {boolean} The availability flag of this clock
   */
  getAvailabilityFlag(): boolean {
    return this._availability;
  }

  /**
   * Convert a time value for this clock into a time value corresponding to teh underlying system time source being used by the root clock.
   *
   * <p>For example: if this clock is part of a hierarchy, where the root clock of the hierarchy is a [DateNowClock]{@link DateNowClock} then
   * this method converts the supplied time to be in the same units as <tt>Date.now()</tt>.
   *
   * @param {number} ticksWhen Time value of this clock.
   * @return {number} The corresponding time value in the units of the underlying system clock that is being used by the root clock, or <tt>NaN</tt> if this conversion is not possible.
   * @abstract
   */
  calcWhen(ticksWhen: number): number {
    throw "Unimplemented";
  }

  /**
   * Return the root clock for the hierarchy that this clock is part of.
   *
   * <p>If this clock is the root clock (it has no parent), then it will return itself.
   *
   * @return {ClockBase} The root clock of the hierarchy
   */
  getRoot(): ClockBase {
    let p: ClockBase = this;
    let p2 = p.getParent();
    while (p2) {
      p = p2;
      p2 = p.getParent();
    }
    return p;
  }

  /**
   * Convert a time for the root clock to a time for this clock.
   * @param {number} t A time value of the root clock.
   * @returns {number} The corresponding time value for this clock.
   */
  fromRootTime(t: number): number {
    const p = this.getParent();
    if (!p) {
      return t;
    } else {
      const x = p.fromRootTime(t);
      return this.fromParentTime(x);
    }
  }

  /**
   * Convert a time for this clock to a time for the root clock.
   * @param {number} t A time value for this clock.
   * @returns {number} The corresponding time value of the root clock, or <tt>NaN</tt> if this is not possible.
   */
  toRootTime(t: number): number {
    const p = this.getParent();
    if (!p) {
      return t;
    } else {
      const x = this.toParentTime(t);
      return p.toRootTime(x);
    }
  }

  /**
   * Convert a time value for this clock to a time value for any other clock in the same hierarchy as this one.
   * @param {ClockBase} otherClock The clock to convert the value value to.
   * @param {number} t Time value of this clock.
   * @returns {number} The corresponding time value for the specified <tt>otherClock</tt>, or <tt>NaN</tt> if this is not possible.
   * @throws if this clock is not part of the same hierarchy as the other clock.
   */
  toOtherClockTime(otherClock: ClockBase, t: number): number {
    const selfAncestry = this.getAncestry();
    const otherAncestry = otherClock.getAncestry();

    let common = false;
    while (selfAncestry.length && otherAncestry.length && selfAncestry[selfAncestry.length - 1] === otherAncestry[otherAncestry.length - 1]) {
      selfAncestry.pop();
      otherAncestry.pop();
      common = true;
    }

    if (!common) {
      throw "No common ancestor clock.";
    }

    selfAncestry.forEach(clock => {
      t = clock.toParentTime(t);
    });

    otherAncestry.reverse();

    otherAncestry.forEach(clock => {
      t = clock.fromParentTime(t);
    });

    return t;
  }

  /**
   * Get an array of the clocks that are the parents and ancestors of this clock.
   * @returns {ClockBase[]} an array starting with this clock and ending with the root clock.
   */
  getAncestry(): ClockBase[] {
    const ancestry: ClockBase[] = [this];
    let c: ClockBase | null = this;
    while (c) {
      const p = c.getParent();
      if (p) {
        ancestry.push(p);
      }
      c = p;
    }
    return ancestry;
  }

  /**
   * Convert time value of this clock to the equivalent time of its parent.
   *
   * @param {number} t Time value of this clock
   * @returns {number} corresponding time of the parent clock, or <tt>NaN</tt> if this is not possible.
   * @abstract
   */
  toParentTime(t: number): number {
    throw "Unimplemented";
  }

  /**
   * Convert time value of this clock's parent to the equivalent time of this clock.
   * @param {number} t Time value of this clock's parent
   * @returns {number} corresponding time of this clock.
   * @abstract
   */
  fromParentTime(t: number): number {
    throw "Unimplemented";
  }

  /**
   * Returns the parent of this clock, or <tt>null</tt> if it has no parent.
   * @returns {ClockBase | null} parent clock, or <tt>null</tt>
   * @abstract
   */
  getParent(): ClockBase | null {
    throw "Unimplemented";
  }

  /**
   * Set/change the parent of this clock.
   * @param {ClockBase | null} newParent clock, or <tt>null</tt>
   * @throws if it is not allowed to set this clock's parent.
   * @abstract
   * @event change
   */
  setParent(newParent: ClockBase | null): void {
    throw "Unimplemented";
  }

  /**
   * Calculate the potential for difference between this clock and another clock.
   * @param {ClockBase} otherClock The clock to compare with.
   * @returns {number} The potential difference in units of seconds. If effective speeds or tick rates differ, this will always be <tt>Number.POSITIVE_INFINITY</tt>
   *
   * If the clocks differ in effective speed or tick rate, even slightly, then
   * this means that the clocks will eventually diverge to infinity, and so the
   * returned difference will equal +infinity.
   *
   * If the clocks do not differ in effective speed or tick rate, then there will
   * be a constant time difference between them. This is what is returned.
   */
  clockDiff(otherClock: ClockBase): number {
    const thisSpeed = this.getEffectiveSpeed();
    const otherSpeed = otherClock.getEffectiveSpeed();

    if (thisSpeed !== otherSpeed) {
      return Number.POSITIVE_INFINITY;
    } else if (this.getTickRate() !== otherClock.getTickRate()) {
      return Number.POSITIVE_INFINITY;
    } else {
      const root = this.getRoot();
      const t = root.now();
      const t1 = this.fromRootTime(t);
      const t2 = otherClock.fromRootTime(t);
      return Math.abs(t1 - t2) / this.getTickRate();
    }
  }

  /**
   * Calculates the dispersion (maximum error bounds) at the specified clock time.
   * This takes into account the contribution to error of this clock and its ancestors.
   * @param {number} t The time position of this clock for which the dispersion is to be calculated.
   * @returns {number} Dispersion (in seconds) at the specified clock time.
   */
  dispersionAtTime(t: number): number {
    let disp = this._errorAtTime(t);

    const p = this.getParent();
    if (p) {
      const pt = this.toParentTime(t);
      disp += p.dispersionAtTime(pt);
    }

    return disp;
  }

  /**
   * Calculates the error/uncertainty contribution of this clock at a given time position.
   *
   * <p>It is not intended that this function is called directly. Instead, call
   * [dispersionAtTime()]{@link ClockBase.dispersionAtTime} which uses this function
   * as part of calculating the total dispersion.
   *
   * @param {number} t A time position of this clock
   * @returns {number} the potential for error (in seconds) arising from this clock
   * at a given time of this clock. Does not include the contribution of
   * any parent clocks.
   *
   * @abstract
   */
  _errorAtTime(t: number): number {
    throw "Unimplemented";
  }

  /**
   * Retrieve the maximium frequency error (in ppm) of the root clock in the hierarchy.
   *
   * <p>This method contains an implementation for non-root clocks only. It must
   * be overriden for root clock implementations.
   *
   * @returns {number} The maximum frequency error of the root clock (in parts per million)
   * @abstract
   */
  getRootMaxFreqError(): number {
    const root = this.getRoot();
    if (root === this) {
      throw "Unimplemented";
    } else {
      return root.getRootMaxFreqError();
    }
  }

  /**
   * A callback that is called when using [setTimeout]{@link ClockBase#setTimeout} or [setAtTime][@link ClockBase#setAtTime].
   *
   * @callback setTimeoutCallback
   * @param {...*} args The parameters that were passed when the callback was scheduled.
   * @this ClockBase
   */

  /**
   * Request a timeout callback when the time of this clock passes the current time plus
   * the number of specified ticks.
   *
   * <p>If there are changes to timing caused by changes to this clock or its parents, then this timer will be automatically
   * rescheduled to compensate.
   *
   * @param {setTimeoutCallback} func  The function to callback
   * @param {number} ticks  The callback is triggered when the clock passes (reaches or jumps past) this number of ticks beyond the current time.
   * @param {...*} args Other arguments are passed to the callback
   * @returns A handle for the timer. Pass this handle to [clearTimeout]{@link ClockBase#clearTimeout} to cancel this timer callback.
   */
  setTimeout(func: (...args: any[]) => void, ticks: number, ...args: any[]): TimerHandle {
    return this.setAtTime(func, ticks + this.now(), ...args);
  }

  /**
   * Request a timeout callback when the time of this clock passes the specified time.
   *
   * <p>If there are changes to timing caused by changes to this clock or its parents, then this timer will be automatically
   * rescheduled to compensate.
   *
   * @param {setTimeoutCallBack} func  The function to callback
   * @param {number} when  The callback is triggered when the clock passes (reaches or jumps past) this time.
   * @param {...*} args Other arguments are passed to the callback
   * @returns A handle for the timer. Pass this handle to [clearTimeout]{@link ClockBase#clearTimeout} to cancel this timer callback.
   */
  setAtTime(func: (...args: any[]) => void, when: number, ...args: any[]): TimerHandle {
    const self = this;
    const handle: TimerHandle = self.id + ":timeout-" + nextTimeoutHandle++;
    let root = self.getRoot();

    if (root === null) {
      root = self;
    }

    const callback = () => {
      delete self.timerHandles[handle];
      func.apply(self, args);
    };

    let numRootTicks = self.toRootTime(when) - root.now();
    if (numRootTicks !== 0) {
      numRootTicks = root.getSpeed() !== 0 ? numRootTicks / root.getSpeed() : NaN;
    }
    const millis = numRootTicks * (1000 / root.getTickRate());
    let realHandle;
    if (!isNaN(millis)) {
      realHandle = setTimeout(callback, millis);
    }

    this.timerHandles[handle] = { realHandle, when, callback };

    return handle;
  }

  private _rescheduleTimers(): void {
    const root = this.getRoot();

    for (const handle in this.timerHandles) {
      if (this.timerHandles.hasOwnProperty(handle)) {
        const d = this.timerHandles[handle];

        if (d.realHandle !== null && d.realHandle !== undefined) {
          clearTimeout(d.realHandle);
        }

        let numRootTicks = this.toRootTime(d.when) - root.now();
        if (numRootTicks !== 0) {
          numRootTicks = root.getSpeed() !== 0 ? numRootTicks / root.getSpeed() : NaN;
        }
        const millis = numRootTicks * (1000 / root.getTickRate());
        if (!isNaN(millis)) {
          d.realHandle = setTimeout(d.callback, Math.max(0, millis));
        } else {
          delete d.realHandle;
        }
      }
    }
  }

  /**
   * Clear (cancel) a timer that was scheduled using [setTimeout]{@link ClockBase#setTimeout} or [setAtTime][@link ClockBase#setAtTime].
   *
   * @param handle - The handle for the previously scheduled callback.
   *
   * If the handle does not represent a callback that was scheduled against this clock, then this method returns without doing anything.
   */
  clearTimeout(handle: TimerHandle): void {
    const d = this.timerHandles[handle];
    if (d !== undefined) {
      if (d.realHandle) {
        clearTimeout(d.realHandle);
      }
      delete this.timerHandles[handle];
    }
  }
}
