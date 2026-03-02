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

import { UdpAdaptor } from "../SocketAdaptors/UdpAdaptor.js";
import { WallClockServerProtocol, WallClockServerProtocolOptions } from "./WallClockServerProtocol.js";
import { BinarySerialiser } from "./BinarySerialiser.js";
import { CorrelatedClock } from "@iimrd/dvbcss-clocks";
import { Socket as DgramSocket } from "dgram";

/**
 * @memberof dvbcss-protocols.WallClock
 * Factory function that creates a Wall Clock server that uses a UDP socket
 * and sends/receives protocol messages in binary format.
 *
 * <p>Does not work in the browser.</p>
 *
 * @param {DgramSocket} boundDgramSocket UDP datagram socket bound to protocol designated port number
 * @param {CorrelatedClock} wallClock
 * @param {WallClockServerProtocolOptions} protocolOptions Object.
 * @returns {UdpAdaptor} The UDP adaptor wrapping the whole server
 */
const createBinaryUdpServer = (boundDgramSocket: DgramSocket, wallClock: CorrelatedClock, protocolOptions: WallClockServerProtocolOptions): UdpAdaptor => {
    return new UdpAdaptor(
        new WallClockServerProtocol(
            wallClock,
            BinarySerialiser,
            protocolOptions
        ),
        boundDgramSocket);
};

export default createBinaryUdpServer;
