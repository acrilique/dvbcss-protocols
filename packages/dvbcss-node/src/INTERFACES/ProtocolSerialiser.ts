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

 * Interface for protocol message serialisation/deserialisation
 *
 */
export interface ProtocolSerialiser {
    /**
     * Serialise an object representing a protocol message ready for transmission on the wire
     * @param msg - Object representing protocol message.
     * @returns The serialsed message.
     */
    pack(msg: any): string | ArrayBuffer | Uint8Array;

    /**
     * Deserialise a received protocol message into an object representing it
     * @param msg - The received serialised message.
     * @returns Object representing the protocol message.
     */
    unpack(msg: string | ArrayBuffer | Uint8Array): any;
}
