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

import { Correlation, CorrelatedClock } from "@iimrd/dvbcss-clocks";
import { WallClockMessage } from "./WallClockMessage.js";

/**
 * @memberof dvbcss-protocols.WallClock
 * Represents a measurement candidate. Is derived from a response {WallClockMessage}
 *
 * <p>All values in units of nanoseconds or ppm
 */
export class Candidate {
    /**
     * Request sent time (in nanoseconds)
     */
    public t1: number;
    /**
     * Request received time (in nanoseconds)
     */
    public t2: number;
    /**
     * Response sent time (in nanoseconds)
     */
    public t3: number;
    /**
     * Response received time (in nanoseconds)
     */
    public t4: number;
    /**
     * Clock precision (in nanoseconds)
     */
    public precision: number;
    /**
     * Maximum frequency error (in ppm)
     */
    public mfe: number;
    /**
     * The WallClockMessage from which this candidate was derived
     */
    public msg: WallClockMessage;

    /**
     * @param wcMsg - A response message from which the candidate will be based.
     * @param nanosRx - Time the message was received (in nanoseconds)
     */
    constructor(wcMsg: WallClockMessage, nanosRx: number) {
        if (!wcMsg.isResponse()) {
            throw "Not a response message";
        }

        this.t1 = WallClockMessage.secsAndNanosToNanos(wcMsg.originate_timevalue_secs, wcMsg.originate_timevalue_nanos);
        this.t2 = wcMsg.receive_timevalue * 1000000000;
        this.t3 = wcMsg.transmit_timevalue * 1000000000;
        this.t4 = nanosRx;
        this.precision = wcMsg.precision * 1000000000;
        this.mfe = wcMsg.max_freq_error;
        this.msg = wcMsg;
    }

    /**
     * Returns a Correlation that corresponds to the measurement represented by this Candidate
     *
     * @param clock - The clock that the correlation will be applied to
     * @returns correlation representing the candidate, including error/uncertainty information
     */
    public toCorrelation(clock: CorrelatedClock): Correlation {
        if (!clock.parent) {
            throw new Error("clock.parent is null");
        }
        const t1 = clock.parent.fromNanos(this.t1);
        const t4 = clock.parent.fromNanos(this.t4);
        const t2 = clock.fromNanos(this.t2);
        const t3 = clock.fromNanos(this.t3);

        const rtt = (this.t4 - this.t1) - (this.t3 - this.t2);

        const mfeC = clock.getRootMaxFreqError() / 1000000; // ppm to fraction
        const mfeS = this.mfe / 1000000; // ppm to fraction

        const c = new Correlation({
            parentTime: (t1 + t4) / 2,
            childTime:  (t2 + t3) / 2,
            initialError: (
                    this.precision +
                    rtt / 2 +
                    mfeC * (this.t4 - this.t1) + mfeS * (this.t3 - this.t2)
                ) / 1000000000, // nanos to secs
            errorGrowthRate: mfeC + mfeS
        });
        return c;
    }
}

export default Candidate;