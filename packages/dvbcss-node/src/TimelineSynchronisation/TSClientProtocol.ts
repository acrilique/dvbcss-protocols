/****************************************************************************
 * Copyright 2017 Institut für Rundfunktechnik
 * and contributions Copyright 2017 British Broadcasting Corporation.
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
 * --------------------------------------------------------------------------
 * Summary of parts containing contributions
 *   by British Broadcasting Corporation (BBC):
 *     TSClientProtocol.prototype.handleMessage :
 *         availablility and change significance checks
*****************************************************************************/

import { EventEmitter } from "events";
import { Correlation, CorrelatedClock } from "dvbcss-clocks";
import { ProtocolHandler } from "../INTERFACES/ProtocolHandler";
import { ControlTimestamp } from "./ControlTimestamp";
import { TSSetupMessage } from "./TSSetupMessage";

/**
 * @memberof dvbcss-protocols.TimelineSynchronisation
 * 
 * Options for the TSClientProtocol handler.
 */
export interface TSClientProtocolOptions {
    /**
     * The Content Identifier stem to match the timed content.
     */
    contentIdStem: string;
    /**
     * The Timeline Selector describing the type and location of the timeline.
     */
    timelineSelector: string;
    /**
     * The tick rate of the timeline. If specified, it will be used to set the tick rate of the provided clock.
     */
    tickRate?: number;
}

/**
 * @memberof dvbcss-protocols.TimelineSynchronisation

 * Implementation of the client part of the timeline synchronization protocol as defined in DVB CSS.
 * The protocol is initiated with `start()`. The CorrelatedClock object passed into the constructor is updated with ControlTimestamps
 * sent by the server (MSAS).
 *
 * @implements ProtocolHandler
 */
export class TSClientProtocol extends EventEmitter implements ProtocolHandler {
    private syncTLClock: CorrelatedClock;
    private contentIdStem: string;
    private timelineSelector: string;
    private prevControlTimestamp?: ControlTimestamp;
    private _isStarted: boolean;

    /**
     * @param {CorrelatedClock} syncTLClock The clock to represent the timeline. It will be updated according to the timestamp messages received.
     * @param {TSClientProtocolOptions} options Options for this TSClientProtocol handler.
     */
    constructor(syncTLClock: CorrelatedClock, options: TSClientProtocolOptions) {
        super();

        if (
            !syncTLClock ||
            typeof syncTLClock.setCorrelation !== "function" ||
            typeof options.contentIdStem !== "string" ||
            typeof options.timelineSelector !== "string"
        ) {
            throw new Error("TSClientProtocol(): Invalid parameters");
        }

        this.syncTLClock = syncTLClock;
        this.contentIdStem = options.contentIdStem;
        this.timelineSelector = options.timelineSelector;

        const tr = Number(options.tickRate);
        if (!isNaN(tr) && tr > 0) {
            this.syncTLClock.tickRate = tr;
        }

        this.syncTLClock.setAvailabilityFlag(false);
        this._isStarted = false;
    }

    public start(): void {
        this.sendSetupMessage();
        this._isStarted = true;
    }

    public stop(): void {
        this.syncTLClock.setAvailabilityFlag(false);
        this._isStarted = false;
    }

    /**
     * Handle control timestamps and update the CorrelatedClock that represents the synchronization timeline.
     *
     * @param {string} msg The control timestamp as defined in DVB CSS.
     * @param rinfo
     */
    public handleMessage(msg: string, rinfo?: any): void {
        try {
            const cts = ControlTimestamp.deserialise(msg);
            this.prevControlTimestamp = cts;

            const isAvailable = cts.contentTime !== null;

            if (cts.contentTime !== null && cts.wallClockTime !== null && cts.timelineSpeedMultiplier !== null && this.syncTLClock.parent) {
                const correlation = new Correlation(this.syncTLClock.parent.fromNanos(cts.wallClockTime), cts.contentTime);
                const speed = cts.timelineSpeedMultiplier;

                if (!this.syncTLClock.availabilityFlag || this.syncTLClock.isChangeSignificant(correlation, speed, 0.010)) {
                    this.syncTLClock.setCorrelationAndSpeed(correlation, speed);
                }
            }

            this.syncTLClock.setAvailabilityFlag(isAvailable);
        } catch (e) {
            const err = e as Error;
            throw new Error(`TSCP handleMessage: exception: ${err.message} -- msg: ${msg}`);
        }
    }

    /**
     * Returns true if the protocol handler is running.
     * @returns {boolean}
     */
    public isStarted(): boolean {
        return this._isStarted;
    }

    /**
     * Sends the setup message to the server.
     */
    private sendSetupMessage(): void {
        const setupMsg = new TSSetupMessage(this.contentIdStem, this.timelineSelector);
        this.emit("send", setupMsg.serialise(), { binary: false });
    }
}

export default TSClientProtocol;
