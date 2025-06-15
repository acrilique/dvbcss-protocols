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

import { ProtocolHandler } from "../INTERFACES/ProtocolHandler.js";
import { SocketAdaptor } from "../INTERFACES/SocketAdaptor.js";
import { Socket as DgramSocket, RemoteInfo } from "dgram";

/**
 * @memberof dvbcss-protocols.SocketAdaptors
 * Adaptor that manages a bound UDP datagram socket and interfaces it to a protocol handler.
 *
 * <p>Does not work in the browser.</p>
 *
 * <p>It calls the handleMessage() method of the protocol handler when messages are received with type {ArrayBuffer}.
 * And it listens for {event:send} fired by the protocol handler to send messages.
 *
 * <p>The destination routing information is an object with "port" and "address" properties.
 *
 * @implements SocketAdaptor
 */
export class UdpAdaptor implements SocketAdaptor {
    private protocolHandler: ProtocolHandler;
    private dgramSocket: DgramSocket;
    private handlers: { close: () => void; message: (msg: Buffer, rinfo: RemoteInfo) => void; };
    private sendCallback: (msg: string | Uint8Array, rinfo: RemoteInfo) => void;

    /**
     * @param {ProtocolHandler} protocolHandler
     * @param {DgramSocket} boundDgramSocket A datagram socket that is already bound.
     */
    constructor(protocolHandler: ProtocolHandler, boundDgramSocket: DgramSocket) {
        this.protocolHandler = protocolHandler;
        this.dgramSocket = boundDgramSocket;

        this.handlers = {
            close: this.stop.bind(this),
            message: (msg: Buffer, rinfo: RemoteInfo) => {
                this.protocolHandler.handleMessage(new Uint8Array(msg).buffer, rinfo);
            }
        };

        this.dgramSocket.on("close", this.handlers.close);
        this.dgramSocket.on("message", this.handlers.message);

        this.sendCallback = (msg, rinfo) => {
            const buf = Buffer.from(msg);
            this.dgramSocket.send(buf, 0, buf.length, rinfo.port, rinfo.address);
        };

        this.protocolHandler.on("send", this.sendCallback);
        this.protocolHandler.start();
    }

    /**
     * Force this adaptor to stop. Also calls the stop() method of the protocol handlers
     */
    public stop() {
        this.dgramSocket.removeListener("close", this.handlers.close);
        this.dgramSocket.removeListener("message", this.handlers.message);
        this.protocolHandler.removeListener("send", this.sendCallback);
        this.protocolHandler.stop();
    }

    /**
     * @returns True if the underlying protocol handler is running.
     */
    public isStarted(): boolean {
        return this.protocolHandler.isStarted();
    }
}

export default UdpAdaptor;
