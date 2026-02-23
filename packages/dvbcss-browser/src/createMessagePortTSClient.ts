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

import { TSClientProtocol, TSClientProtocolOptions } from "dvbcss-node";
import { CorrelatedClock } from "dvbcss-clocks";
import { MessagePortAdaptor } from "./MessagePortAdaptor.js";

/**
 * Factory function that creates a Timeline Synchronisation client that
 * communicates over a MessagePort, sending/receiving CSS-TS messages in JSON format.
 *
 * <p>This is the browser/TWA equivalent of createTSClient — designed
 * for use when the native side relays raw CSS-TS WebSocket messages
 * over a MessagePort.
 *
 * <p>The syncTLClock must have its parent set to a clock representing the
 * Wall Clock (synchronised via CSS-WC).
 *
 * @param port A MessagePort connected to the native relay for CSS-TS.
 * @param syncTLClock The CorrelatedClock to represent the synchronised timeline.
 *                    Updated automatically as ControlTimestamp messages are received.
 * @param clientOptions Options including contentIdStem and timelineSelector.
 * @returns The MessagePortAdaptor wrapping the whole client.
 */
export const createMessagePortTSClient = (
    port: MessagePort,
    syncTLClock: CorrelatedClock,
    clientOptions: TSClientProtocolOptions,
): MessagePortAdaptor => {
    return new MessagePortAdaptor(
        new TSClientProtocol(
            syncTLClock,
            clientOptions,
        ),
        port,
    );
};
