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
 *     CorrelatedClock.prototype.calcWhen
 *     CorrelatedClock.prototype.toParentTime
 *     CorrelatedClock.prototype.setParent
 *     CorrelatedClock.prototype.quantifySignedChange
 *     CorrelatedClock.prototype.quantifyChange
 ****************************************************************************/

import ClockBase from './ClockBase.js';
import Correlation from './Correlation.js';

export interface CorrelatedClockOptions {
  tickRate?: number;
  speed?: number;
  correlation?: Correlation | { parentTime: number, childTime: number, initialError?: number, errorGrowthRate?: number } | [number, number, number?, number?];
}

/**
 * Clock based on a parent clock using a {@link Correlation}.
 * It is a subclass of {@link ClockBase}.
 *
 * <p>The correlation determines how the time of this clock is calculated from
 * the time of the parent clock.
 * The correlation represents a point where a given time of the parent equates
 * to a given time of this clock (the child clock).
 *
 * <p>In effect, the combination of all these factors can be though of as defining
 * a striaght line equation with the parent clock's time on the X-axis and this
 * clock's time on the Y-axis. The line passes through the point of correlation
 * and the slope is dictated by the tick rates of both clocks and the speed of
 * this clock.
 *
 * Speed and tick rate are then taken into account to extrapolate from that
 * point.
 *
 *
 *
 *
 * @override
 * @param {ClockBase} parent The parent for this clock.
 * @param {object} [options] Options for this clock
 * @param {Number} [options.tickRate] Initial tick rate for this clock (in ticks per second).
 * @param {Number} [options.speed] The speed for this clock.
 * @param {Correlation|object|Number[]} [options.correlation] Correlation for this clock as either as a Correlation object, or as an object with properties corresponding to the properties of a correlation, or as an array of values. See examples below
 * @default tickRate: 1000, speed: 1.0, correlation: Correlation(0,0,0,0)
 *
 * @example
 * root = new DateNowClock();
 *
 * // tickRate = 1000, correlation = (0,0)
 * c1 = new CorrelatedClock(root);
 *
 * // tickRate = 25, speed=2.0, correlation = (0,0)
 * c1 = new CorrelatedClock(root, {tickRate:25, speed:2.0});
 *
 * // tickRate = 1000, correlation = (10,500)
 * c2 = new CorrelatedClock(root, { correlation: new Correlation(10,500) });
 * c2 = new CorrelatedClock(root, { correlation: [10,500] });
 * c2 = new CorrelatedClock(root, { correlation: {parentTime:10,childTime:500} });
 */
export default class CorrelatedClock extends ClockBase {
  private freq: number;
  private _speed: number;
  private _parent: ClockBase | null;
  private corr: Correlation;
  private parentHandlers: { [key: string]: (...args: any[]) => void };

  constructor(parent: ClockBase, options?: CorrelatedClockOptions) {
    super();

    if (options && (typeof options.tickRate !== "undefined")) {
      if (options.tickRate <= 0) {
        throw "Cannot have tickrate of zero or less";
      }
      this.freq = options.tickRate;
    } else {
      this.freq = 1000;
    }

    if (options && (typeof options.speed !== "undefined")) {
      this._speed = options.speed;
    } else {
      this._speed = 1.0;
    }

    this._parent = parent;

    if (options && (typeof options.correlation !== "undefined")) {
      this.corr = new Correlation(options.correlation);
    } else {
      this.corr = new Correlation(0, 0, 0, 0);
    }

    this.parentHandlers = {
      "change": (causeClock: ClockBase) => {
        this.emit("change", this);
      },
      "available": this.notifyAvailabilityChange.bind(this),
      "unavailable": this.notifyAvailabilityChange.bind(this),
    };

    this._parent = null;
    this.setParent(parent);
  }

  /**
   * @inheritdoc
   */
  now(): number {
    if (this._parent === null || this._parent === undefined) {
      return NaN
    }

    return this.corr.childTime + (this._parent.now() - this.corr.parentTime) * this.freq * this._speed / this._parent.getTickRate();
  }

  /**
   * @returns {String} A human readable summary of this clock object, including its [id]{@link CorrelatedClock#id} and its current properties
   * @example
   * > c=new CorrelatedClock(parent);
   * > c.toString()
   * 'CorrelatedClock(clock_0, {tickRate:1000, speed:1, correlation:[object Object]}) [clock_1]'
   */
  toString(): string {
    let p: string;
    if (this._parent) {
      p = this._parent.id;
    } else {
      p = "<<no-parent>>";
    }
    return "CorrelatedClock(" + p + ", {tickRate:" + this.freq + ", speed:" + this._speed + ", correlation:" + this.corr + "}) [" + this.id + "]";
  }

  /**
   * @inheritdoc
   */
  getSpeed(): number {
    return this._speed;
  }

  /**
   * @inheritdoc
   */
  setSpeed(newSpeed: number): void {
    if (this._speed != newSpeed) {
      this._speed = newSpeed;
      this.emit("change", this);
    }
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
  setTickRate(newTickRate: number): void {
    if (this.freq != newTickRate) {
      this.freq = newTickRate;
      this.emit("change", this);
    }
  }

  rebaseCorrelationAt(t: number): void {
    this.corr = this.corr.butWith({
      parentTime: this.toParentTime(t),
      childTime: t,
      initialError: this._errorAtTime(t)
    });
  }

  /**
   * @type {Correlation} correlation The correlation used by this clock to define its relationship to its parent.
   *
   * <p>Read this property to obtain the correlation currently being used.
   *
   * <p>Change the correlation by setting this property to a new one. Either assign a {@link Correlation} object, or an object containing
   * keys representing the properties of the correlation, or an Array containing the values for the correlation.
   *
   * <p>The underlying implementation fo this property uses the
   * [getCorrelation]{@link ClockBase#getCorrelation} and
   * [setCorrelation]{@link ClockBase#setCorrelation} methods.
   *
   * @example
   * clock = new CorrelatedClock(parentClock);
   * clock.correlation = new Correlation(1,2);
   * clock.correlation = [1,2];
   * clock.correlation = { parentTime:1, childTime:2 };
   * clock.correlation = clock.correlation.butWith({initialError:0.5, errorGrowthRate:0.1});
   */
  get correlation(): Correlation {
    return this.getCorrelation();
  }

  set correlation(v: Correlation) {
    this.setCorrelation(v);
  }

  /**
   * Retrieve the correlation for this clock.
   * @returns {Correlation} correlation The correlation for this clock
   */
  getCorrelation(): Correlation {
    return this.corr;
  }

  /**
   * Set/change the correlation for this clock.
   * @param {Correlation} newCorrelation The new correlation for this clock
   */
  setCorrelation(newCorrelation: Correlation): void {
    this.corr = new Correlation(newCorrelation);
    this.emit("change", this);
  }

  /**
   * Set/change the correlation and speed for this clock as a single operation.
   *
   * <p>Using this method instead of setting both separately only generates a single
   * "change" event notification.
   *
   * @param {Correlation} newCorrelation The new correlation for this clock
   * @param {Number} newSpeed The new speed for this clock
   */
  setCorrelationAndSpeed(newCorrelation: Correlation, newSpeed: number): void {
    this.corr = new Correlation(newCorrelation);
    this._speed = newSpeed;
    this.emit("change", this);
  }

  /**
   * @inheritdoc
   */
  calcWhen(t: number): number {
    if (!this._parent) {
      return NaN;
    }
    return this._parent.calcWhen(this.toParentTime(t));
  }

  /**
   * Convert time value of this clock to the equivalent time of its parent.
   *
   * <p>If this clock's speed is zero (meaning that it is paused) then if <tt>t</tt>
   * does not equal the current time of this clock, then <tt>NaN</tt> will be returned.
   * This is because there is no equivalent time of the parent clock.
   *
   * @param {Number} t Time value of this clock
   * @returns {Number} corresponding time of the parent clock or <tt>NaN</tt> if not possible when clock speed is zero.
   * @abstract
   */
  toParentTime(t: number): number {
    if (this._parent === null || this._parent === undefined) {
      return NaN;
    } else if (this._speed === 0) {
      return (t === this.corr.childTime) ? this.corr.parentTime : NaN;
    } else {
      return this.corr.parentTime + (t - this.corr.childTime) * this._parent.getTickRate() / this.freq / this._speed;
    }
  }

  /**
   * @inheritdoc
   */
  fromParentTime(t: number): number {
    if (this._parent === null || this._parent === undefined) {
      return NaN;
    } else {
      return this.corr.childTime + (t - this.corr.parentTime) * this.freq * this._speed / this._parent.getTickRate();
    }
  }

  /**
   * @inheritdoc
   */
  getParent(): ClockBase | null {
    return this._parent;
  }

  /**
   * @inheritdoc
   */
  setParent(newParent: ClockBase | null): void {
    if (this._parent != newParent) {
      if (this._parent) {
        for (const event in this.parentHandlers) {
          this._parent.removeListener(event, this.parentHandlers[event]);
        }
      }

      this._parent = newParent;

      if (this._parent) {
        for (const event in this.parentHandlers) {
          this._parent.on(event, this.parentHandlers[event]);
        }
      }

      this.emit("change", this);
    }
  }

  /**
   * Calculate the potential for difference in tick values of this clock if a
   * different correlation and speed were to be used.
   *
   * Changes where the new time would become greater return positive values.
   *
   * <p>If the new speed is different, even slightly, then this means that the
   * ticks reported by this clock will eventually differ by infinity,
   * and so the returned value will equal ±infinity. If the speed is unchanged
   * then the returned value reflects the difference between old and new correlations.
   *
   * @param {Correlation} newCorrelation A new correlation
   * @param {Number} newSpeed A new speed
   * @returns {Number} The potential difference in units of seconds. If speeds
   * differ, this will always be <tt>Number.POSITIVE_INFINITY</tt> or <tt>Number.NEGATIVE_INFINITY</tt>
   */
  quantifySignedChange(newCorrelation: Correlation, newSpeed: number): number {
    newCorrelation = new Correlation(newCorrelation);

    if (newSpeed != this._speed) {
      return (newSpeed > this._speed) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else {
      const nx = newCorrelation.parentTime;
      const nt = newCorrelation.childTime;
      if (newSpeed !== 0) {
        const ox = this.toParentTime(nt);
        if (!this._parent) {
          return NaN;
        }
        return (nx - ox) / this._parent.getTickRate();
      } else {
        const ot = this.fromParentTime(nx);
        return (nt - ot) / this.freq;
      }
    }
  }

  /**
   * Calculate the absolute value of the potential for difference in tick values of this
   * clock if a different correlation and speed were to be used.
   *
   * <p>If the new speed is different, even slightly, then this means that the
   * ticks reported by this clock will eventually differ by infinity,
   * and so the returned value will equal +infinity. If the speed is unchanged
   * then the returned value reflects the difference between old and new correlations.
   *
   * @param {Correlation} newCorrelation A new correlation
   * @param {Number} newSpeed A new speed
   * @returns {Number} The potential difference in units of seconds. If speeds
   * differ, this will always be <tt>Number.POSITIVE_INFINITY</tt>
   */
  quantifyChange(newCorrelation: Correlation, newSpeed: number): number {
    return Math.abs(this.quantifySignedChange(newCorrelation, newSpeed));
  }

  /**
   * Returns True if the potential for difference in tick values of this clock
   * (using a new correlation and speed) exceeds a specified threshold.
   *
   * <p>This is implemented by applying a threshold to the output of
   * [quantifyChange()]{@link CorrelatedClock#quantifyChange}.
   *
   * @param {Correlation} newCorrelation A new correlation
   * @param {Number} newSpeed A new speed
   * @param {Number} thresholdSecs Threshold in seconds
   * @returns {Boolean} True if the potential difference can/will eventually exceed the threshold.
   */
  isChangeSignificant(newCorrelation: Correlation, newSpeed: number, thresholdSecs: number): boolean {
    const delta = this.quantifyChange(newCorrelation, newSpeed);
    return delta > thresholdSecs;
  }

  /**
   * @inheritdoc
   */
  _errorAtTime(t: number): number {
    if (!this._parent) {
      return NaN;
    }
    const pt = this.toParentTime(t);
    const deltaSecs = Math.abs(pt - this.corr.parentTime) / this._parent.getTickRate();
    return this.corr.initialError + deltaSecs * this.corr.errorGrowthRate;
  }
}
