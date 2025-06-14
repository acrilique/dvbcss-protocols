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

/**
 * Interface for code that implements the logic of a protocol.
 *
 * <p>A protocol handler emits a "send" event to send messages, and is passed recieved
 * messages by having its {@link handleMessage}
 * method called.
 *
 * @event send
 */
export interface ProtocolHandler extends EventEmitter {
  /**
   * Starts the protocol handler running
   */
  start(): void;

  /**
   * Stops the protocol handler
   */
  stop(): void;

  /**
   * Handle a received message
   * @param msg The received message, not yet deserialised
   * @param source Opaque data to be passed back when sending the response, to ensure it is routed back to the sender
   */
  handleMessage(msg: any, source: any): void;

  /**
   * @event send
   * Protocol handler needs a message to be sent.
   * @param msg The message payload to send
   * @param routing Expresses the routing/destination. Opaque handle. If not defined, then goes to default destination (if there is one)
   */
  on(event: "send", listener: (msg: string | Uint8Array, routing?: any) => void): this;
  emit(event: "send", msg: string | Uint8Array, routing?: any): boolean;

  isStarted(): boolean;
}
