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

/**
 * @memberof dvbcss-protocols
 * @namespace CII
 * This namespace contains classes, methods and objects implementing the [CII protocol]{@tutorial cii-protocol}.
 *
 * <p>The simplest way to use them is to create the WebSocket connection to the CII server
 * and then pass it to the appropriate factory function:
 * <ul>
 *   <li> [createCIIClient(...)]{@link dvbcss-protocols.CII.createCIIClient}
 * </ul>
 * <p>...then add an event listener to be notified of changes to CII state.
 * This is the recommended method.
 *
 * <p>You can alternatively pass in a [callback]{@link ciiChangedCallback} via the options property
 * that will be called whenever CII changes.
 *
 * @example
 * <caption>Using a CII client to synchronise to CII state on a server, and register an event listener to receive updates:</caption>
 * var WebSocket = require('ws');
 * var Protocols = require("dvbcss-protocols");
 * var createClient = Protocols.CII.createCIIClient;
 * 
 * var ws = new WebSocket("ws://127.0.0.1:7681/cii");
 * 
 * var options = {};
 * var client = createClient(ws, options);
 * 
 * client.on('change', function(cii, changes, mask) {
 *     console.log("CII state is now: ",cii)
 *
 *     console.log("The following properties changed value:")
 *     for (var name in changes) {
 *         if (changes[name]) {
 *             console.log("    ",name)
 *         }
 *     }
 *
 *     if (mask & CIIMessage.CIIChangeMask.FIRST_CII_RECEIVED) {
 *         console.log("This was the first CII received")
 *     }
 *
 *     if (mask & CIIMessage.CIIChangeMask.CONTENTID_CHANGED) {
 *         console.log("The content ID changed")
 *     }
 * });
 *
 * @example
 * <caption>Using a CII client to synchronise to CII state on a server, and use a callback to receive updates:</caption>
 * var WebSocket = require('ws');
 * var Protocols = require("dvbcss-protocols");
 * var createClient = Protocols.CII.createCIIClient;
 * 
 * var ws = new WebSocket("ws://127.0.0.1:7681/cii");
 * 
 * var options = { callback: ciiChangeCallback };
 * var client = createClient(ws, options);
 * 
 * function ciiChangeCallback(cii, mask) {
 *     console.log("CII state is now: ",cii)
 *
 *     if (mask & CIIMessage.CIIChangeMask.FIRST_CII_RECEIVED) {
 *         console.log("This was the first CII received")
 *     }
 *
 *     if (mask & CIIMessage.CIIChangeMask.CONTENTID_CHANGED) {
 *         console.log("The content ID changed")
 *     }
 * });
 *
 */

import { EventEmitter } from "events";
import { WebSocketAdaptor } from "../SocketAdaptors/WebSocketAdaptor.js";
import { SocketAdaptor } from "../INTERFACES/SocketAdaptor.js";
import CIIClientProtocol from "./CIIClientProtocol.js";

export class AdaptorWrapper extends EventEmitter {
    public adaptor: SocketAdaptor;

    constructor(ciiClientProtocol: CIIClientProtocol, adaptor: SocketAdaptor) {
        super();
        this.adaptor = adaptor;

        ciiClientProtocol.on("change", (cii, changes, mask) => {
            this.emit("change", cii, changes, mask);
        });
    }

    public stop() {
        return this.adaptor.stop();
    }

    public isStarted() {
        return this.adaptor.isStarted();
    }
}

/**
 * @memberof dvbcss-protocols.CII
 * Factory function that creates a CII client that uses a WebSocket
 * and sends/receives protocol messages in JSON format.
 *
 * @param webSocket A W3C WebSockets API compatible websocket connection object
 * @param clientOptions
 * @returns The WebSocket adaptor wrapping the whole client, but with change event added
 */
export const createCIIClient = function (webSocket: WebSocket, clientOptions: object): AdaptorWrapper {
    const protocol = new CIIClientProtocol(clientOptions);
    const wsa = new WebSocketAdaptor(protocol, webSocket);

    return new AdaptorWrapper(protocol, wsa);
};

export default createCIIClient;
