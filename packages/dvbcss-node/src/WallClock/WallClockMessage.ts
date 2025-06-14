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

/**
 * Values permitted for the 'type' field in a wall clock message
 * @enum
 */
export enum WallClockMessageTypes {
    /** 0 - request **/
    request = 0,
    /** 1 - response **/
    response = 1,
    /** 2 - response with follow-up promised **/
    responseWithFollowUp = 2,
    /** 3 - follow-up response **/
    followUp = 3
}

/**
 * @memberof dvbcss-protocols.WallClock
 * Object for representing a wall clock message. User a ProtocolSerialiser to convert to/from the format in which the message is carried on the wire.
 */
export class WallClockMessage {
    /**
     * Protocol message format version.
     */
    public version: number;
    /**
     * Message type
     */
    public type: WallClockMessageTypes;
    /**
     * Clock precision (in seconds and fractions of a second).
     */
    public precision: number;
    /**
     * Clock maximum frequency error (in ppm).
     */
    public max_freq_error: number;
    /**
     * Request sent time (seconds part)
     */
    public originate_timevalue_secs: number;
    /**
     * Request sent time (nanoseconds part)
     */
    public originate_timevalue_nanos: number;
    /**
     * Request received time (seconds+fractions of second)
     */
    public receive_timevalue: number;
    /**
     * Response sent time (seconds+fractions of second)
     */
    public transmit_timevalue: number;

    /**
     * @param version - Should be 0.
     * @param type - The message type.
     * @param precision - Clock precision (in seconds and fractions of a second).
     * @param max_freq_error - Clock maximum frequency error (in ppm).
     * @param originate_timevalue_secs - Request sent time (seconds part)
     * @param originate_timevalue_nanos - Request sent time (nanoseconds part)
     * @param receive_timevalue - Request received time (seconds+fractions of second)
     * @param transmit_timevalue - Response sent time (seconds+fractions of second)
     */
    constructor(version: number, type: WallClockMessageTypes, precision: number, max_freq_error: number, originate_timevalue_secs: number, originate_timevalue_nanos: number, receive_timevalue: number, transmit_timevalue: number) {
        this.version = version;
        this.type = type;
        this.precision = precision;
        this.max_freq_error = max_freq_error;
        this.originate_timevalue_secs = originate_timevalue_secs;
        this.originate_timevalue_nanos = originate_timevalue_nanos;
        this.receive_timevalue = receive_timevalue;
        this.transmit_timevalue = transmit_timevalue;
    }

    /**
     * @returns True if this message object represents a response message
     */
    public isResponse(): boolean {
        switch (this.type) {
            case WallClockMessageTypes.response:
            case WallClockMessageTypes.responseWithFollowUp:
            case WallClockMessageTypes.followUp:
                return true;
            default:
                return false;
        }
    }

    /**
     * Make an object representing a wall clock protocol request
     * @param localSendtimeSecs - The seconds part of the send time
     * @param localSendTimeNanos - The nanoseconds part of the send time
     * @returns object representing Wall Clock protocol message
     */
    public static makeRequest(localSendtimeSecs: number, localSendTimeNanos: number): WallClockMessage {
        return new WallClockMessage(0, WallClockMessageTypes.request, 0, 0, localSendtimeSecs, localSendTimeNanos, 0, 0);
    }

    /**
     * Create a response message based on this request message
     * @param responseType - the type field for the message
     * @param precision - The precision of the clock.
     * @param max_freq_error - The maximum frequency error of the clock.
     * @param rxTime - The time at which the request was received (in nanoseconds)
     * @param txTime - The time at which this response is being sent (in nanoseconds)
     * @returns New object representing the response message
     */
    public toResponse(responseType: WallClockMessageTypes, precision: number, max_freq_error: number, rxTime: number, txTime: number): WallClockMessage {
        return new WallClockMessage(
            this.version,
            responseType,
            precision,
            max_freq_error,
            this.originate_timevalue_secs,
            this.originate_timevalue_nanos,
            rxTime,
            txTime
        );
    }

    /**
     * @returns True if the properties of this object match this one
     */
    public equals(obj: WallClockMessage | undefined | null): boolean {
        if (typeof obj === "undefined" || obj === null) { return false; }

        return this.version === obj.version &&
            this.type === obj.type &&
            this.precision === obj.precision &&
            this.max_freq_error === obj.max_freq_error &&
            this.originate_timevalue_secs === obj.originate_timevalue_secs &&
            this.originate_timevalue_nanos === obj.originate_timevalue_nanos &&
            this.receive_timevalue === obj.receive_timevalue &&
            this.transmit_timevalue === obj.transmit_timevalue;
    }

    /**
     * convert a timevalue (in units of nanoseconds) into separate values representing a seconds part and a fractional nanoseconds part
     * @param n - time value in nanoseconds
     * @returns array of two numbers [secs, nanos] containing the seconds and the nanoseconds
     */
    public static nanosToSecsAndNanos(n: number): [number, number] {
        const secs = Math.trunc(n / 1000000000);
        const nanos = Math.trunc(n % 1000000000);
        return [secs, nanos];
    }

    /**
     * convert separate seconds and nanoseconds values into a single nanosecond time value
     * @param secs - Seconds part only
     * @param nanos - Nanoseconds part only
     * @return combined time value (in nanoseconds)
     */
    public static secsAndNanosToNanos(secs: number, nanos: number): number {
        return (Math.trunc(secs) * 1000000000) + Math.trunc(nanos % 1000000000);
    }
}
