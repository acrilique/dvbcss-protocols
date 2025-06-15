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

import { CorrelatedClock } from "dvbcss-clocks";
import { WallClockServerProtocol, WallClockServerProtocolOptions } from "./WallClockServerProtocol.js";
import { ProtocolSerialiser } from "../INTERFACES/ProtocolSerialiser.js";
import { SocketAdaptor } from "../INTERFACES/SocketAdaptor.js";

/**
 * @memberof dvbcss-protocols.WallClock
 * Factory function that creates a Wall Clock server.
 *
 * @param {any} socket Socket object representing the connection e.g. a UDP socket or a WebSocket
 * @param {new (protocolHandler: WallClockServerProtocol, socket: any) => T} AdaptorClass Adaptor class for the socket object
 * @param {ProtocolSerialiser} serialiser Message seraliser
 * @param {CorrelatedClock} wallClock
 * @param {WallClockServerProtocolOptions} protocolOptions Object.
 * @returns {SocketAdaptor} The Socket adaptor wrapping the whole server.
 */
const createServer = <T extends SocketAdaptor>(
    socket: any,
    AdaptorClass: new (protocolHandler: WallClockServerProtocol, socket: any) => T,
    serialiser: ProtocolSerialiser,
    wallClock: CorrelatedClock,
    protocolOptions: WallClockServerProtocolOptions
): T => {
    return new AdaptorClass(
        new WallClockServerProtocol(
            wallClock,
            serialiser,
            protocolOptions
        ),
        socket
    );
};

export default createServer;
