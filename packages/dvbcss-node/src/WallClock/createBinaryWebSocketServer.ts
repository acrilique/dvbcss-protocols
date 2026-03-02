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

import { WebSocketAdaptor } from "../SocketAdaptors/WebSocketAdaptor.js";
import { WallClockServerProtocol, WallClockServerProtocolOptions } from "./WallClockServerProtocol.js";
import { BinarySerialiser } from "./BinarySerialiser.js";
import { CorrelatedClock } from "@iimrd/dvbcss-clocks";

/**
 * @memberof dvbcss-protocols.WallClock
 * @description
 * Factory function that creates a Wall Clock server that uses a WebSocket
 * and sends/receeives protocol messages in binary format.
 *
 * <p>Does not work in the browser.</p>
 *
 * @param {webSocket} webSocket A W3C WebSockets API compatible websocket connection object
 * @param {CorrelatedClock} wallClock
 * @param {WallClockServerProtocolOptions} protocolOptions Object.
 * @returns {dvbcss-protocols.SocketAdaptors.WebSocketAdaptor} The WebSocket adaptor wrapping the whole server
 */
const createBinaryWebSocketServer = (webSocket: WebSocket, wallClock: CorrelatedClock, protocolOptions: WallClockServerProtocolOptions): WebSocketAdaptor => {
    return new WebSocketAdaptor(
        new WallClockServerProtocol(
            wallClock,
            BinarySerialiser,
            protocolOptions
        ),
        webSocket);
};

export default createBinaryWebSocketServer;
