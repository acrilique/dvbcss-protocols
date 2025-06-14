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
 * @namespace SocketAdaptors
 * <p><em>It is unlikely that you will need to use anything in this namespace directly
 * unless you are implementing new protocol handlers or serialisation options.</em>.
 *
 * <p>This namspace contains adaptors for various kind of socket objects representing network connections.
 * These are used internally by the createXXX() methods defined in the other
 * namespaces.
 *
 * <p>These adaptors interface between the object representing the network connection
 * (such as a {@link WebSocket} or a node.js [dgram_Socket]{@link dgram_Socket}) and the {@link ProtocolHandler}.
 */

import { ProtocolHandler } from "../INTERFACES/ProtocolHandler";
import { SocketAdaptor } from "../INTERFACES/SocketAdaptor";

/**
 * @memberof dvbcss-protocols.SocketAdaptors

 * Adaptor that manages a websocket connection and interfaces it to a protocol handler.
 *
 * <p>It calls the handleMessage() method of the protocol handler when messages are received.
 * And it listens for {event:send} fired by the protocol handler to send messages.
 *
 * <p>The destination routing information is not used because WebSockets are connection oriented.
 *
 * @implements SocketAdaptor
 */
export class WebSocketAdaptor implements SocketAdaptor {
    private protocolHandler: ProtocolHandler;
    private webSocket: WebSocket;
    private handlers: { open: (evt: Event) => void; close: (evt: CloseEvent) => void; message: (evt: MessageEvent) => void; };
    private send: (msg: string | ArrayBuffer, dest?: any) => void;

    /**
     * @param protocolHandler
     * @param webSocket
     * @listens send
     */
    constructor(protocolHandler: ProtocolHandler, webSocket: WebSocket) {
        this.protocolHandler = protocolHandler;
        this.webSocket = webSocket;

        this.handlers = {
            open: (evt: Event) => {
                this.protocolHandler.start();
            },

            close: (evt: CloseEvent) => {
                this.protocolHandler.stop();
            },

            message: (evt: MessageEvent) => {
                let msg: string | ArrayBuffer;

                try {
                    if (evt.data instanceof ArrayBuffer) {
                        msg = evt.data;
                    } else if (typeof evt.data === "string") {
                        msg = evt.data;
                    } else {
                        msg = new Uint8Array(evt.data).buffer;
                    }

                    this.protocolHandler.handleMessage(msg, null); // no routing information
                } catch (error) {
                    this.webSocket.close();
                }
            }
        };

        this.webSocket.addEventListener("open", this.handlers.open);
        this.webSocket.addEventListener("close", this.handlers.close);
        this.webSocket.addEventListener("message", this.handlers.message);

        // handle requests to send
        this.send = (msg: string | ArrayBuffer, dest?: any) => {
            if (dest) {
                (this.webSocket as any).send(msg, dest);
            } else {
                (this.webSocket).send(msg);
            }
        };

        this.protocolHandler.on("send", this.send);

        // if already open, commence
        if (this.webSocket.readyState == 1) {
            this.protocolHandler.start();
        }
    }

    /**
     * Force this adaptor to stop. Also calls the stop() method of the protocol handlers
     */
    public stop(): void {
        this.webSocket.removeEventListener("open", this.handlers.open);
        this.webSocket.removeEventListener("close", this.handlers.close);
        this.webSocket.removeEventListener("message", this.handlers.message);
        this.protocolHandler.removeListener("send", this.send);
        this.protocolHandler.stop();
    }

    public isStarted(): boolean {
        return this.protocolHandler.isStarted();
    }
}
