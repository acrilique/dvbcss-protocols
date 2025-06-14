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

import { EventEmitter } from "events";
import CIIMessage from "./CIIMessage";
import { ProtocolHandler} from "../INTERFACES/ProtocolHandler";

/**
 * CII Client callback
 * @callback ciiChangedCallback
 * @param cii The current CII state
 * @param changemask A [bitfield mask]{@link CIIMessage.CIIChangeMask} describing which CII properties have just changed
 */
export type ciiChangedCallback = (cii: CIIMessage, changemask: number) => void;

export interface CIIClientProtocolOptions {
    callback?: ciiChangedCallback;
}

/**
 * @memberof dvbcss-protocols.CII

 * Implementation of the client part of the CII protocol as defined in DVB CSS.
   With start() the protocol is initiated.
 *
 * @implements ProtocolHandler
 * @event CIIClientProtocol#change
 */
export class CIIClientProtocol extends EventEmitter implements ProtocolHandler {
    private _cii: CIIMessage;
    private lastCII?: CIIMessage;
    private started: boolean = false;
    private CIIChangeCallback?: ciiChangedCallback;

    /**
     * @param clientOptions Optional. Parameters for this protocol client.
     */
    constructor(clientOptions: CIIClientProtocolOptions = {}) {
        super();
        this._cii = new CIIMessage(undefined, null, undefined, undefined, undefined, undefined, undefined, undefined);
        this.CIIChangeCallback = clientOptions.callback;
    }

    /**
     * The current CII state, as shared by the server (the TV).
     * This is not the most recently received message (since that may only
     * describe changes since the previous message). Instead this is the result
     * of applying those changes to update the client side model of the server
     * side CII state.
     */
    public get cii(): CIIMessage {
        return this._cii;
    }

    public start(): void {
        this.started = true;
    }

    public stop(): void {
        this.started = false;
    }

    /**
     * Handle CII messages .
     *
     * @param msg the control timestamp as defined in DVB CSS
     * @param source
     */
    public handleMessage(msg: string | ArrayBuffer, source?: any): void {
        let changemask: number;
        const changeNames: { [key: string]: boolean } = {};

        const receivedCII = CIIMessage.deserialise(msg);

        if (typeof receivedCII !== "undefined") {
            changemask = this._cii.compare(receivedCII, changeNames);

            if (this.lastCII === undefined) {
                changemask |= CIIMessage.CIIChangeMask.FIRST_CII_RECEIVED;
            }
            this.lastCII = receivedCII;
            this._cii = this._cii.merge(receivedCII);

            if (changemask != 0) {
                if (this.CIIChangeCallback !== undefined) {
                    this.CIIChangeCallback(this._cii, changemask);
                }
                /**
                 * @event change
                 * The CII state of the server has changed.
                 * @param cii The current CII state of the server
                 * @param changedNames
                 * @param changeMask A [bitfield mask]{@link CIIMessage.CIIChangeMask} describing which CII properties have just changed
                 */
                this.emit("change", this._cii, changeNames, changemask);
            }
        }
    }

    /**
     * Returns true if this protocol handler is started.
     */
    public isStarted(): boolean {
        return this.started;
    }
}

export default CIIClientProtocol;
