/****************************************************************************
 * Copyright 2017 British Broadcasting Corporation
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
*****************************************************************************/

import ClockBase from './ClockBase.js';
import { measurePrecision } from './measurePrecision.js';

const DATENOW_PRECISION = measurePrecision(Date.now.bind(Date), 100) / 1000;

export interface DateNowClockOptions {
  tickRate?: number;
  maxFreqErrorPpm?: number;
}

/**
 * Root clock based on <tt>Date.now()</tt>.
 * It is a subclass of {@link ClockBase}.
 *
 * <p>This clock can be used as the root of a hierarchy of clocks. It uses
 * <tt>Date.now()</tt> as its underlying system clock. However this clock can
 * be set to have its own tick rate, independent of <tt>Date.now()</tt>.
 *
 * <p>The precision of Date.now() is meausred when the module containing this
 * class is first imported. The dispersion reported by this clock will always
 * equal the measurement precision.
 *
 * @override
 * @param {object} [options] Options for this clock
 * @param {Number} [options.tickRate] Initial tick rate for this clock (in ticks per second).
 * @param {Number} [options.maxFreqErrorPpm] The maximum frequency error of the underlying clock (in ppm).
 * @default tickRate: 1000, maxFreqErrorPpm: 50
 *
 * @example
 * // milliseconds (default)
 * root = new DateNowClock({tickRate: 1000000000 });
 *
 * // nanoseconds
 * root = new DateNowClock({tickRate: 1000000000 });
 *
 * // nanoseconds, lower freq error than default
 * root = new DateNowClock({tickRate: 1000000000, maxFreqErrorPpm: 10 });
 *
 * @abstract
 */
export default class DateNowClock extends ClockBase {
  private freq: number;
  private maxFreqErrorPpm: number;
  private precision: number;

  constructor(options?: DateNowClockOptions) {
    super();

    if (options && (typeof options.tickRate !== "undefined")) {
      if (options.tickRate <= 0) {
        throw "Cannot have tickrate of zero or less";
      }
      this.freq = options.tickRate;
    } else {
      this.freq = 1000;
    }

    if (options && (typeof options.maxFreqErrorPpm !== "undefined")) {
      this.maxFreqErrorPpm = options.maxFreqErrorPpm;
    } else {
      this.maxFreqErrorPpm = 50;
    }

    this.precision = DATENOW_PRECISION;
  }

  /**
   * @inheritdoc
   */
  now(): number {
    return Date.now() / 1000 * this.freq;
  }

  /**
   * @inheritdoc
   */
  getTickRate(): number {
    return this.freq;
  }

  /**
   * @inheritdoc
   */
  calcWhen(t: number): number {
    return t / this.freq * 1000;
  }

  /**
   * @returns {String} A human readable summary of this clock object, including its [id]{@link DateNowClock#id} and its current properties
   * @example
   * > c=new DateNowClock();
   * > c.toString()
   * 'DateNowClock({tickRate:1000, maxFreqErrorPpm:50}) [clock_0]'
   */
  toString(): string {
    return "DateNowClock({tickRate:" + this.freq + ", maxFreqErrorPpm:" + this.maxFreqErrorPpm + "}) [" + this.id + "]";
  }

  /**
   * @inheritdoc
   */
  toParentTime(t: number): number {
    throw "Clock has no parent.";
  }

  /**
   * @inheritdoc
   */
  fromParentTime(t: number): number {
    throw "Clock has no parent.";
  }

  /**
   * @inheritdoc
   */
  getParent(): null {
    return null;
  }

  /**
   * The parent of this clock is always <tt>null</tt> and cannot be changed.
   * @throws because this clock cannot have a parent.
   */
  setParent(newParent: ClockBase): void {
    throw "Cannot set a parent for this clock.";
  }

  /**
   * This clock is always available, and so its [availabilityFlag]{@link DateNowClock#availabilityFlag} cannot be changed.
   * @throws because this clock cannot have its availabilty changed.
   */
  setAvailabilityFlag(availability: boolean): void {
    if (!availability) {
      throw "Cannot change availability of this clock.";
    }
  }

  /**
   * @inheritdoc
   */
  _errorAtTime(t: number): number {
    return this.precision;
  }

  /**
   * @inheritdoc
   */
  getRootMaxFreqError(): number {
    return this.maxFreqErrorPpm;
  }
}
