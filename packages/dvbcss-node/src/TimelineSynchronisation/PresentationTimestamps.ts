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
 *     PresentationTimestamps.deserialise : arraybuffer coercion
*****************************************************************************/

import PresentationTimestamp from "./PresentationTimestamp.js";

/**
 * @memberof dvbcss-protocols.TimelineSynchronisation

 * Object representing actual, earliest and latest presentation timestamps sent from a synchronistion client to the MSAS.
 */
export class PresentationTimestamps {
    public earliest: PresentationTimestamp;
    public latest: PresentationTimestamp;
    public actual?: PresentationTimestamp;

    /**
     * @param earliest timestamp indicating when the client can present a media sample at the very earliest
     * @param latest timestamp indicating when the client can present a media sample at the very latest
     * @param actual optional timestamp, representing the actual presentation on the client
     */
    constructor(earliest: PresentationTimestamp, latest: PresentationTimestamp, actual?: PresentationTimestamp) {
        this.earliest = earliest;
        this.latest = latest;
        this.actual = actual;

        if (
            !(
                this.earliest instanceof PresentationTimestamp &&
                this.latest instanceof PresentationTimestamp &&
                (this.actual instanceof PresentationTimestamp || this.actual === undefined)
            )
        ) {
            throw "PresentationTimestamps(): Invalid parameters.";
        }
    }

    /**
     * @returns {string} string representation of the PresentationTimestamps as defined by ETSI TS XXX XXX clause 5.7.4
     */
    public serialise(): string {
        return JSON.stringify(this);
    }

    /**
     * @returns {PresentationTimestamps} actual, earliest and latest presentation timestamps from a JSON formatted string
     */
    public static deserialise(jsonVal: string | ArrayBuffer): PresentationTimestamps {
        // coerce from arraybuffer,if needed
        if (jsonVal instanceof ArrayBuffer) {
            jsonVal = String.fromCharCode.apply(null, new Uint8Array(jsonVal) as any);
        }
        const o = JSON.parse(jsonVal as string);

        return new PresentationTimestamps(
            PresentationTimestamp.getFromObj(o.earliest),
            PresentationTimestamp.getFromObj(o.latest),
            o.actual ? PresentationTimestamp.getFromObj(o.actual) : undefined
        );
    }
}

export default PresentationTimestamps;