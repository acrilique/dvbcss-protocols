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
import { CorrelatedClock, ClockBase } from "@iimrd/dvbcss-clocks";
import { WallClockMessageTypes } from "./WallClockMessage.js";
import { ProtocolSerialiser } from "../INTERFACES/ProtocolSerialiser.js";
import { ProtocolHandler } from "../INTERFACES/ProtocolHandler.js";

export interface WallClockServerProtocolOptions {
    precision?: number;
    maxFreqError?: number;
    followup?: boolean;
}

/**
 * @memberof dvbcss-protocols.WallClock

 *
 * Protocol handler that implements a Wall Clock Server .
 *
 * <p>Emits a {@link send} to send messages, and is passed received
 * messages by calling {@link WallClockServerProtocol.handleMessage}
 *
 * <p>Is independent of the underlying type of connection (e.g. WebSocket / UDP)
 * and of the message format used on the wire. You provide a {@link ProtocolSerialiser}
 *
 * <p>Message payloads for sending or receiving are accompanied by opaque "destination"
 * routing data that this class uses as an opaque handle for the server being interacted
 * with.
 *
 * @implements ProtocolHandler
 * @event send
 */
export class WallClockServerProtocol extends EventEmitter implements ProtocolHandler {
    private serialiser: ProtocolSerialiser;
    private wallClock: CorrelatedClock;
    private parentClock: ClockBase | null;
    private precision: number;
    private maxFreqError: number;
    private followup: boolean;
    private started: boolean;

    /**
     * @param {CorrelatedClock} wallClock
     * @param {ProtocolSerialiser} serialiser Object with pack() and unpack() methods, suitable for this particular protocol
     * @param {WallClockServerProtocolOptions} [protocolOptions] Protocol handler options
     */
    constructor(wallClock: CorrelatedClock, serialiser: ProtocolSerialiser, protocolOptions: WallClockServerProtocolOptions = {}) {
        super();

        this.serialiser = serialiser;
        this.wallClock = wallClock;
        this.parentClock = wallClock.parent;

        // initially unavailable and infinite dispersion
        this.wallClock.speed = 1;
        this.wallClock.setAvailabilityFlag(true);

        this.precision = protocolOptions.precision || wallClock.dispersionAtTime(wallClock.now());
        this.maxFreqError = protocolOptions.maxFreqError || wallClock.getRootMaxFreqError();
        this.followup = protocolOptions.followup || false;

        this.started = false;
    }

    public start(): void {
        this.started = true;
    }

    public stop(): void {
        this.started = false;
    }

    /**
     * Handle a received Wall clock protocol request message. Sends back a response and if followup flag set to true, it sends back a followup
     * @param {Object} msg The received message, not already deserialised
     * @param {*} routing Opaque data to be passed back when sending the response, to ensure it is routed back to the sender
     */
    handleMessage(msg: any, routing: any) {
        this.started = true;

        // receive time value
        const t2 = this.wallClock.getNanos();

        const request = this.serialiser.unpack(msg);

        if (request.type === WallClockMessageTypes.request) {
            let reply;
            if (this.followup) {
                reply = request.toResponse(WallClockMessageTypes.responseWithFollowUp, this.precision, this.maxFreqError, t2, this.wallClock.getNanos());
            } else {
                reply = request.toResponse(WallClockMessageTypes.response, this.precision, this.maxFreqError, t2, this.wallClock.getNanos());
            }

            let serialised_reply = this.serialiser.pack(reply);
            this.emit("send", serialised_reply, routing);

            if (this.followup) {
                const followupReply = Object.assign(Object.create(Object.getPrototypeOf(reply)), reply);
                followupReply.type = WallClockMessageTypes.followUp;
                followupReply.transmit_timevalue = this.wallClock.getNanos();

                serialised_reply = this.serialiser.pack(followupReply);
                this.emit("send", serialised_reply, routing);
            }
        } else {
            console.error("WallClockServerProtocol.handlerMessage: received a non-request message");
        }
    }

    /**
     * Returns true if this protocol handler is started.
     */
    isStarted(): boolean {
        return this.started;
    }
}

export default WallClockServerProtocol;
