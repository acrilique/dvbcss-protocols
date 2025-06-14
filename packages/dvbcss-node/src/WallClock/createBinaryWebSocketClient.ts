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

import { WebSocketAdaptor } from "../SocketAdaptors/WebSocketAdaptor";
import { WallClockClientProtocol, WallClockClientProtocolOptions } from "./WallClockClientProtocol";
import { BinarySerialiser } from "./BinarySerialiser";
import { CorrelatedClock } from "dvbcss-clocks";

/**
 * @memberof dvbcss-protocols.WallClock
 * Factory function that creates a Wall Clock client that uses a WebSocket
 * and sends/receives protocol messages in binary format.
 *
 * @param {WebSocket} webSocket A W3C WebSockets API compatible websocket connection object
 * @param {CorrelatedClock} wallClock
 * @param {WallClockClientProtocolOptions} clientOptions
 * @returns {WebSocketAdaptor} The WebSocket adaptor wrapping the whole client
 */
const createBinaryWebSocketClient = (webSocket: WebSocket, wallClock: CorrelatedClock, clientOptions: WallClockClientProtocolOptions): WebSocketAdaptor => {
    return new WebSocketAdaptor(
        new WallClockClientProtocol(
            wallClock,
            BinarySerialiser,
            clientOptions
        ),
        webSocket);
};


export default createBinaryWebSocketClient;
