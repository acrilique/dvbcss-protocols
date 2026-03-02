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

import { ProtocolHandler, SocketAdaptor } from "@iimrd/dvbcss-node";

/**
 * Adaptor that manages a MessagePort and interfaces it to a protocol handler.
 *
 * <p>Works analogously to {@link WebSocketAdaptor} but for the MessagePort API
 * (e.g. ports obtained via MessageChannel or transferred from a TWA / native host).
 *
 * <p>Unlike WebSocket, a MessagePort has no open/close lifecycle events.
 * The port is considered ready immediately, so the protocol handler is started
 * on construction. Call {@link stop} explicitly when the channel is no longer needed.
 *
 * @implements SocketAdaptor
 */
export class MessagePortAdaptor implements SocketAdaptor {
    private protocolHandler: ProtocolHandler;
    private port: MessagePort;
    private messageHandler: (evt: MessageEvent) => void;
    private sendHandler: (msg: string | Uint8Array, dest?: any) => void;
    private stopped: boolean = false;

    /**
     * @param protocolHandler The protocol handler to wire up.
     * @param port The MessagePort to use as transport.
     */
    constructor(protocolHandler: ProtocolHandler, port: MessagePort) {
        this.protocolHandler = protocolHandler;
        this.port = port;

        this.messageHandler = (evt: MessageEvent) => {
            if (this.stopped) return;
            try {
                let msg: string | ArrayBuffer;

                if (evt.data instanceof ArrayBuffer) {
                    msg = evt.data;
                } else if (typeof evt.data === "string") {
                    msg = evt.data;
                } else if (ArrayBuffer.isView(evt.data)) {
                    // Handle typed array views (Uint8Array, etc.)
                    // Use Uint8Array to guarantee an ArrayBuffer (not SharedArrayBuffer)
                    msg = new Uint8Array(evt.data.buffer, evt.data.byteOffset, evt.data.byteLength).slice().buffer;
                } else {
                    // Last resort: try to treat as string
                    msg = String(evt.data);
                }

                this.protocolHandler.handleMessage(msg, null); // no routing info — connection-oriented
            } catch (error) {
                console.error("[MessagePortAdaptor] Error handling message:", error);
            }
        };

        this.sendHandler = (msg: string | Uint8Array, _dest?: any) => {
            if (this.stopped) return;
            if (msg instanceof Uint8Array) {
                // Post the underlying ArrayBuffer (structured clone; no transfer to avoid detach)
                this.port.postMessage(msg.buffer.slice(msg.byteOffset, msg.byteOffset + msg.byteLength));
            } else {
                this.port.postMessage(msg);
            }
        };

        this.port.addEventListener("message", this.messageHandler);
        this.protocolHandler.on("send", this.sendHandler);

        // MessagePort may need start() to begin dispatching events
        // (required when using addEventListener rather than onmessage)
        try {
            this.port.start();
        } catch {
            // start() may not be available in all environments
        }

        // No open/close lifecycle — start the protocol handler immediately
        this.protocolHandler.start();
    }

    /**
     * Stops the adaptor and the protocol handler. Removes all listeners.
     * Does NOT close the underlying MessagePort (the caller owns its lifecycle).
     */
    public stop(): void {
        if (this.stopped) return;
        this.stopped = true;

        this.port.removeEventListener("message", this.messageHandler);
        this.protocolHandler.removeListener("send", this.sendHandler);
        this.protocolHandler.stop();
    }

    public isStarted(): boolean {
        return this.protocolHandler.isStarted();
    }
}
