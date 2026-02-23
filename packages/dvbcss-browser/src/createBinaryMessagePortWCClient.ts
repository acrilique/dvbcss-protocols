/****************************************************************************
 * Copyright 2026 Universitat Politècnica de València
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

import { BinarySerialiser, WallClockClientProtocol, WallClockClientProtocolOptions } from "dvbcss-node";
import { CorrelatedClock } from "dvbcss-clocks";
import { MessagePortAdaptor } from "./MessagePortAdaptor.js";

/**
 * Factory function that creates a Wall Clock client that communicates over
 * a MessagePort using binary-encoded WC protocol messages.
 *
 * <p>This is the browser/TWA equivalent of createBinaryWebSocketClient — designed
 * for use when the native side relays raw CSS-WC UDP payloads over a MessagePort.
 *
 * @param port A MessagePort connected to the native relay for CSS-WC.
 * @param wallClock The CorrelatedClock to be synchronised as the wall clock.
 * @param clientOptions Options for the WallClockClientProtocol.
 * @returns The MessagePortAdaptor wrapping the whole client.
 */
export const createBinaryMessagePortWCClient = (
    port: MessagePort,
    wallClock: CorrelatedClock,
    clientOptions: WallClockClientProtocolOptions = {},
): MessagePortAdaptor => {
    return new MessagePortAdaptor(
        new WallClockClientProtocol(
            wallClock,
            BinarySerialiser,
            clientOptions,
        ),
        port,
    );
};
