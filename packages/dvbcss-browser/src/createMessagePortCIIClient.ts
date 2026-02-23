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

import { AdaptorWrapper, CIIClientProtocol, CIIClientProtocolOptions } from "dvbcss-node";
import { MessagePortAdaptor } from "./MessagePortAdaptor.js";

/**
 * Factory function that creates a CII client that communicates over
 * a MessagePort, sending/receiving CII protocol messages in JSON format.
 *
 * <p>This is the browser/TWA equivalent of createCIIClient — designed
 * for use when the native side relays raw CSS-CII WebSocket messages
 * over a MessagePort.
 *
 * @param port A MessagePort connected to the native relay for CSS-CII.
 * @param clientOptions Options for the CIIClientProtocol.
 * @returns An AdaptorWrapper that emits "change" events when CII state updates.
 */
export const createMessagePortCIIClient = (
    port: MessagePort,
    clientOptions: CIIClientProtocolOptions = {},
): AdaptorWrapper => {
    const protocol = new CIIClientProtocol(clientOptions);
    const adaptor = new MessagePortAdaptor(protocol, port);

    return new AdaptorWrapper(protocol, adaptor);
};
