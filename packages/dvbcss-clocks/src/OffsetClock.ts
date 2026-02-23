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

import ClockBase from "./ClockBase.js";

/**
 * A clock that applies an offset such that reading it is the same as
 * reading its parent, but as if the current time is slightly offset by an
 * amount ahead (+ve offset) or behind (-ve offset).
 * It is a subclass of {@link ClockBase}.
 *
 * <p><tt>OffsetClock</tt> inherits the tick rate of its parent. Its speed is
 * always 1. It takes the effective speed into account when applying the offset,
 * so it should always represent the same amount of time according to the root
 * clock. In practice this means it will be a constant offset amount of real-world
 * time.
 *
 * <p>This can be used to compensate for rendering delays. If it takes N seconds
 * to render some content and display it, then a positive offset of N seconds
 * will mean that the rendering code thinks time is N seconds ahead of where
 * it is. It will then render the correct content that is needed to be displayed
 * in N seconds time.
 *
 * <p>For example: A correlated clock (the "media clock") represents the time
 * position a video player needs to currently be at.
 *
 * <p>The video player has a 40 milisecond (0.040 second) delay between when it renders a frame and the light being emitted by the display. We therefore need the
 * video player to render 40 milliseconds in advance of when the frame is
 * to be displayed. An :class:`OffsetClock` is used to offset time in this
 * way and is passed to the video player:
 *
 * <pre class="prettyprint"><code>
 * mediaClock = new CorrelatedClock(...);
 *
 * PLAYER_DELAY_SECS = 40;
 * oClock = new OffsetClock(mediaClock, {offset:PLAYER_DELAY_SECS});
 *
 * videoPlayer.syncToClock(oClock);
 * </code></pre>
 *
 * <p>If needed, the offset can be altered at runtime, by setting the :data:`offset`
 * property. For example, perhaps it needs to be changed to a 50 millisecond offset:
 *
 * <pre class="prettyprint"><code>
 * oClock.offset = 50;
 * </code></pre>
 *
 * <p>Both positive and negative offsets can be used.
 */
export default class OffsetClock extends ClockBase {
    private _offset: number;
    private _parent: ClockBase | null;
    private parentHandlers: { [key: string]: (...args: any[]) => void };

    constructor(parent: ClockBase, options?: { offset?: number }) {
        super();

        if (options && (typeof options.offset !== "undefined")) {
            if (typeof options.offset === "number") {
                this._offset = options.offset;
            } else {
                throw "'offset' option must be a number (in milliseconds)";
            }
        } else {
            this._offset = 0;
        }

        this.parentHandlers = {
            "change": (causeClock) => {
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
        if (!this._parent) {
            return NaN;
        }
        return this._parent.now() + this._offset * this.getEffectiveSpeed() * this._parent.tickRate / 1000;
    }

    /**
     * @returns {String} A human readable summary of this clock object, including its current properties
     * @example
     * > c=new Offset(parent, {offset:20});
     * > c.toString()
     * 'OffsetClock(clock_0, {offset:20}) [clock_1]'
     */
    toString(): string {
        var p;
        if (this._parent) {
            p = this._parent.id;
        } else {
            p = "<<no-parent>>";
        }
        return "OffsetClock(" + p + ", {offset:" + this._offset + "}) [" + this.id + "]";
    }

    /**
     * @inheritdoc
     */
    getSpeed(): number {
        return 1;
    }

    /**
     * @inheritdoc
     */
    setSpeed(newSpeed: number): void {
        throw "Cannot change the speed of this clock.";
    }

    /**
     * @inheritdoc
     */
    getTickRate(): number {
        if (!this._parent) {
            return 0;
        }
        return this._parent.tickRate;
    }

    /**
     * @inheritdoc
     */
    setTickRate(newTickRate: number): void {
        throw "Cannot change the tick rate of this clock.";
    }

    /**
     * <p>The underlying implementation of this property uses the
     * [getOffset]{@link OffsetClock#getOffset} and
     * [setOffset]{@link OffsetClock#setOffset} methods.
     * @default 1.0
     * @event change
     */
    get offset(): number {
        return this.getOffset();
    }

    set offset(millis: number) {
        this.setOffset(millis);
    }

    /**
     * Read the number of milliseconds by which this clock is ahead (the offset).
     *
     * The offset is in terms of elapsed root clock time, not elapsed time of
     * the parent.
     *
     * @return {Number} The number of milliseconds by which this clock is ahead.
     */
    getOffset(): number {
        return this._offset;
    }

    /**
     * Change the number of milliseconds by which this clock is ahead (the offset)
     *
     * The offset is in terms of elapsed root clock time, not elapsed time of
     * the parent.
     *
     * @param {Number} millis The number of milliseconds by which this clock is ahead.
     */
    setOffset(millis: number): void {
        var changed = millis != this._offset;
        this._offset = millis;
        if (changed) {
            this.emit("change", this);
        }
    }

    /**
     * @inheritdoc
     */
    calcWhen(t: number): number {
        if (!this._parent) {
            return NaN;
        }
        var tt = t + this._offset * this.getEffectiveSpeed() * this._parent.tickRate / 1000;
        return this._parent.calcWhen(this.toParentTime(tt));
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
    setParent(newParent: ClockBase): void {
        var event;

        if (this._parent != newParent) {
            if (this._parent) {
                for (event in this.parentHandlers) {
                    this._parent.removeListener(event, this.parentHandlers[event]);
                }
            }

            this._parent = newParent;

            if (this._parent) {
                for (event in this.parentHandlers) {
                    this._parent.on(event, this.parentHandlers[event]);
                }
            }

            this.emit("change", this);
        }
    }

    /**
     * @inheritdoc
     */
    toParentTime(t: number): number {
        return t - this._offset * this.getEffectiveSpeed() * this.tickRate / 1000;
    }

    /**
     * @inheritdoc
     */
    fromParentTime(t: number): number {
        return t + this._offset * this.getEffectiveSpeed() * this.tickRate / 1000;
    }

    /**
     * @inheritdoc
     */
    _errorAtTime(t: number): number {
        return 0;
    }
}
