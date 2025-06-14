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

import { EventEmitter } from "events";
import { WallClockMessage, WallClockMessageTypes } from "./WallClockMessage";
import Candidate from "./Candidate";
import { CorrelatedClock } from "dvbcss-clocks";
import { ProtocolSerialiser } from "../INTERFACES/ProtocolSerialiser";
import { ProtocolHandler } from "../INTERFACES/ProtocolHandler";

export interface WallClockClientProtocolOptions {
    requestInterval?: number;
    followupTimeout?: number;
    logFunction?: (...args: any[]) => void;
    dest?: any;
}

/**
 * @memberof dvbcss-protocols.WallClock

 *
 * Protocol handler that implements a Wall Clock Client.
 *
 * <p>Emits a {@link send} to send messages, and is passed received
 * messages by calling {@link WallClockClientProtocol.handleMessage}
 *
 * <p>Is independent of the underlying type of connection (e.g. WebSocket / UDP)
 * and of the message format used on the wire. You provide a {ProtocolSerialiser}
 *
 * <p>Message payloads for sending or receiving are accompanied by opaque "destination"
 * routing data that this class uses as an opaque handle for the server being interacted
 * with.
 *
 * @implements ProtocolHandler
 * @event send
 */
export class WallClockClientProtocol extends EventEmitter implements ProtocolHandler {
    private serialiser: ProtocolSerialiser;
    private wallClock: CorrelatedClock;
    private parentClock: CorrelatedClock;
    private altClock: CorrelatedClock;
    private sendTimer: NodeJS.Timeout | null = null;
    private requestInterval: number;
    private followupTimeout: number;
    private log: (...args: any[]) => void;
    private dest: any;
    private responseCache: Map<string, NodeJS.Timeout> = new Map();
    private started: boolean = false;

    /**
     * @param wallClock - The wall clock to be synchronised.
     * @param serialiser - Object with pack() and unpack() methods, suitable for this particular protocol.
     * @param options - Protocol handler options.
     */
    constructor(wallClock: CorrelatedClock, serialiser: ProtocolSerialiser, options: WallClockClientProtocolOptions = {}) {
        super();
        this.serialiser = serialiser;
        this.wallClock = wallClock;
        if (!wallClock.parent) {
            throw new Error("wallClock.parent is null");
        }
        this.parentClock = wallClock.parent as CorrelatedClock;

        // initially unavailable and infinite dispersion
        this.wallClock.correlation = this.wallClock.correlation.butWith({initialError:Number.POSITIVE_INFINITY});
        this.wallClock.speed = 1;
        this.wallClock.availabilityFlag = false;

        this.altClock = new CorrelatedClock(this.parentClock, {tickRate:wallClock.tickRate, correlation:wallClock.correlation});

        this.requestInterval = options.requestInterval ?? 1000;
        this.followupTimeout = options.followupTimeout ?? 3000;
        this.log = options.logFunction ?? (() => {});
        this.dest = options.dest ?? null;

        this.log("WallClockClientProtocol constructor: ", options);
    }

    public start(): void {
        this.log("in WallClockClientProtocol.prototype.start");
        this.sendRequest();
        this.started = true;
    }

    public stop(): void {
        if (this.sendTimer) {
            clearTimeout(this.sendTimer);
            this.sendTimer = null;
        }
        this.started = false;
        this.wallClock.setAvailabilityFlag(false);
    }

    /**
     * Handle the process of sending a request to the WC server
     * @private
     */
    private sendRequest(): void {
        // cancel any existing timer
        if (this.sendTimer) {
            clearTimeout(this.sendTimer);
            this.sendTimer = null;
        }

        // send a request
        const t = WallClockMessage.nanosToSecsAndNanos(this.parentClock.getNanos());
        let msg: WallClockMessage | string | ArrayBuffer | Uint8Array = WallClockMessage.makeRequest(t[0], t[1]);
        msg = this.serialiser.pack(msg);

        this.emit("send", msg, this.dest);

        // schedule the timer
        this.sendTimer = setTimeout(() => this.sendRequest(), this.requestInterval);
    }

    /**
     * Handle a received Wall clock protocol message
     * @param msg - The received message, not already deserialised
     * @param routing - Opaque data to be passed back when sending the response, to ensure it is routed back to the sender
     */
    public handleMessage(msg: string | ArrayBuffer, routing: any): void {
        const t4 = this.parentClock.getNanos();
        const unpackedMsg = this.serialiser.unpack(msg);

        const key = `${unpackedMsg.originate_timevalue_secs}:${unpackedMsg.originate_timevalue_nanos}`;

        if (unpackedMsg.type === WallClockMessageTypes.responseWithFollowUp) {
            // follow-up is promised ... set timeout to use it
            const handle = setTimeout(() => {
                this.responseCache.delete(key);
                this.updateClockIfCandidateIsImprovement(unpackedMsg, t4);
            }, this.followupTimeout);
            this.responseCache.set(key, handle);
        } else {
            if (unpackedMsg.type === WallClockMessageTypes.followUp) {
                // followup! cancel the timer, if one is cached
                if (this.responseCache.has(key)) {
                    const handle = this.responseCache.get(key);
                    clearTimeout(handle!);
                    this.responseCache.delete(key);
                }
            }
            this.updateClockIfCandidateIsImprovement(unpackedMsg, t4);
        }
    }

    private updateClockIfCandidateIsImprovement(msg: WallClockMessage, t4: number): void {
        const candidate = new Candidate(msg, t4);
        const candidateCorrelation = candidate.toCorrelation(this.wallClock);

        this.altClock.setCorrelation(candidateCorrelation);

        const now = this.wallClock.now();

        const dispersionNew = this.altClock.dispersionAtTime(now);
        const dispersionExisting = this.wallClock.dispersionAtTime(now);

        if (dispersionNew < dispersionExisting) {
            this.wallClock.correlation = this.altClock.correlation;
            this.wallClock.availabilityFlag = true;
        }
    }

    /**
     * Returns true if this protocol handler is started.
     */
    public isStarted(): boolean {
        return this.started;
    }
}
