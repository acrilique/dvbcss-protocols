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

import { WallClockMessage } from "./WallClockMessage";
import { ProtocolSerialiser } from "../INTERFACES/ProtocolSerialiser";

interface SerialisedWallClockMessage {
    v: number;
    t: number;
    p: number;
    mfe: number;
    otvs: number;
    otvn: number;
    rt: number;
    tt: number;
}

/**
 * @memberof dvbcss-protocols.WallClock
 * JsonSerialiser message serialiser/deserialiser for Wall Clock protocol messages
 *
 * @implements {ProtocolSerialiser}
 */
export const JsonSerialiser: ProtocolSerialiser = {
    /**
     * Serialise an object representing a Wall Clock protocol message ready for transmission on the wire
     * @param wcMsg - Object representing Wall Clock protocol message.
     * @returns The serialsed message.
     */
    pack: function(wcMsg: WallClockMessage): string {

        if (wcMsg.version != 0) { throw "Invalid message version"; }

        const serialised: SerialisedWallClockMessage = {
            v:    Number(wcMsg.version),
            t:    Number(wcMsg.type),
            p:    Number(wcMsg.precision),
            mfe:  Number(wcMsg.max_freq_error),
            otvs: Number(wcMsg.originate_timevalue_secs),
            otvn: Number(wcMsg.originate_timevalue_nanos),
            rt:   Number(wcMsg.receive_timevalue),
            tt:   Number(wcMsg.transmit_timevalue)
        };
        return JSON.stringify(serialised);
    },

    /**
     * Deserialise a received Wall Clock protocol message into an object representing it
     * @param jsonMsg - The received serialsed message.
     * @returns Object representing the Wall Clock protocol message.
     */
    unpack: function(jsonMsg: string | ArrayBuffer): WallClockMessage {
        // coerce from arraybuffer,if needed
        let jsonStr: string;
        if (jsonMsg instanceof ArrayBuffer) {
            jsonStr = String.fromCharCode.apply(null, Array.from(new Uint8Array(jsonMsg)));
        } else {
            jsonStr = jsonMsg;
        }

        const parsedMsg: SerialisedWallClockMessage = JSON.parse(jsonStr);

        if (parsedMsg.v != 0) { throw "Invalid message version"; }

        return new WallClockMessage(
            parsedMsg.v,
            parsedMsg.t,
            parsedMsg.p,
            parsedMsg.mfe,
            parsedMsg.otvs,
            parsedMsg.otvn,
            parsedMsg.rt,
            parsedMsg.tt
        );
    }
};

export default JsonSerialiser;
