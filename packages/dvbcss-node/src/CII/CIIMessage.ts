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

import TimelineProperties from "./TimelineProperties";

/**
 * @memberof dvbcss-protocols.CII

 * Object representing a CII message sent from the MSAS to the synchronisation clients.
 */
export class CIIMessage {
    public protocolVersion?: string;
    public mrsUrl?: string | null;
    public contentId?: string;
    public contentIdStatus?: string;
    public presentationStatus?: string;
    public wcUrl?: string;
    public tsUrl?: string;
    public timelines?: TimelineProperties[];

    /**
     * @param protocolVersion The protocol version being used by the server or `undefined`.
     * @param mrsUrl The URL of an MRS server known to the server, or `null` or `undefined`.
     * @param contentId Content identifier URI, or `undefined`.
     * @param contentIdStatus Content identifier status, or `undefined`
     * @param presentationStatus Presentation status as a string, e.g. "okay", or `undefined`
     * @param wcUrl CSS-WC server endpoint URL in the form “udp://<host>:<port>”, or `undefined`.
     * @param tsUrl CSS-TS server endpoint WebSocket URL, or `undefined`.
     * @param timelines Array of timeline property objects, or `undefined`.
     */
    constructor(
        protocolVersion?: string,
        mrsUrl?: string | null,
        contentId?: string,
        contentIdStatus?: string,
        presentationStatus?: string,
        wcUrl?: string,
        tsUrl?: string,
        timelines?: TimelineProperties[]
    ) {
        this.protocolVersion = protocolVersion;
        this.mrsUrl = mrsUrl;
        this.contentId = contentId;
        this.contentIdStatus = contentIdStatus;
        this.presentationStatus = presentationStatus;
        this.wcUrl = wcUrl;
        this.tsUrl = tsUrl;
        this.timelines = timelines;
    }

    /**
     * Serialise to JSON
     * @returns {String} JSON representation of this CII message as defined by ETSI TS 103 286 clause 5.6.7
     */
    public serialise(): string {
        return JSON.stringify(this);
    }

    /**
     * Parse a JSON representation of a CII message as defined by ETSI TS 103 286 clause 5.6.7.
     * @param jsonVal The CII message encoded as JSON.
     * @returns {CIIMessage} with the same properties as the JSON§ passed as the argument
     */
    public static deserialise(jsonVal: string | ArrayBuffer): CIIMessage {
        // coerce from arraybuffer,if needed
        if (jsonVal instanceof ArrayBuffer) {
            jsonVal = String.fromCharCode.apply(null, new Uint8Array(jsonVal) as any);
        }
        const o = JSON.parse(jsonVal as string);

        let myTimelines: TimelineProperties[] = [];
        if (Array.isArray(o.timelines)) {
            o.timelines.forEach((timelineObj: any) => {
                const timeline = TimelineProperties.getFromObj(timelineObj);
                if (typeof timeline !== "undefined") {
                    myTimelines.push(timeline);
                }
            });
        }
        return new CIIMessage(
            o.protocolVersion,
            o.msrUrl,
            o.contentId,
            o.contentIdStatus,
            o.presentationStatus,
            o.wcUrl,
            o.tsUrl,
            myTimelines
        );
    }

    /**
     * A set of bit masks representing each property in a CII message. Used by ORing together to flag which properties have changed in [ciiChangedCallback()]{@link ciiChangedCallback}
     * @readonly
     * @enum {number}
     */
    public static CIIChangeMask = {
        /** Mask for the bit that is set if this is the first CII message received */
        FIRST_CII_RECEIVED: 1 << 0,
        /** Mask for the bit that is set if the "mrsUrl" property has changed */
        MRS_URL_CHANGED: 1 << 1,
        /**  Mask for the bit that is set if the "contentId" property has changed */
        CONTENTID_CHANGED: 1 << 2,
        /** Mask for the bit that is set if the "contentIdStatus" property has changed */
        CONTENTID_STATUS_CHANGED: 1 << 3,
        /** Mask for the bit that is set if the "presentationStatus" property has changed */
        PRES_STATUS_CHANGED: 1 << 4,
        /** Mask for the bit that is set if the "wcUrl" property has changed */
        WC_URL_CHANGED: 1 << 5,
        /** Mask for the bit that is set if the "tsUrl" property has changed */
        TS_URL_CHANGED: 1 << 6,
        /** Mask for the bit that is set if the "timelines" property has changed */
        TIMELINES_CHANGED: 1 << 7,
        /** Mask for the bit that is set if the "protocolVersion" property has changed */
        PROTOCOL_VERSION_CHANGED: 1 << 8,
    };

    /**
     * Checks if two CII Message objects are equivalent
     * by checking if all CII properties match exactly.
     * @param obj
     * @returns {Boolean} Truthy if the properties of both CIIMessage objects  are equal.
     */
    public equals(obj: any): boolean {
        try {
            return (
                typeof obj === "object" &&
                this.protocolVersion === obj.protocolVersion &&
                this.mrsUrl === obj.mrsUrl &&
                this.contentId === obj.contentId &&
                this.contentIdStatus === obj.contentIdStatus &&
                this.presentationStatus === obj.presentationStatus &&
                this.wcUrl === obj.wcUrl &&
                this.tsUrl === obj.tsUrl &&
                CIIMessage.timelinesEqual(this.timelines, obj.timelines)
            );
        } catch (e) {
            return false;
        }
    }

    private static timelinesEqual(tA?: TimelineProperties[], tB?: TimelineProperties[]): boolean {
        return (
            tA === tB ||
            (tA instanceof Array &&
                tB instanceof Array &&
                tA.length === tB.length &&
                tA.map((e, i) => {
                    return e.equals(tB[i]);
                }).reduce((x, y) => {
                    return x && y;
                }, true))
        );
    }

    public compare(anotherCII: CIIMessage, retChanges: { [key: string]: boolean } = {}): number {
        let changemask = 0;
        const CII_KEYS = [
            "protocolVersion",
            "mrsUrl",
            "contentId",
            "contentIdStatus",
            "presentationStatus",
            "tsUrl",
            "wcUrl",
            "timelines",
        ];
        const CHANGE_MASKS: { [key: string]: number } = {
            protocolVersion: CIIMessage.CIIChangeMask.PROTOCOL_VERSION_CHANGED,
            mrsUrl: CIIMessage.CIIChangeMask.MRS_URL_CHANGED,
            contentId: CIIMessage.CIIChangeMask.CONTENTID_CHANGED,
            contentIdStatus: CIIMessage.CIIChangeMask.CONTENTID_STATUS_CHANGED,
            presentationStatus: CIIMessage.CIIChangeMask.PRES_STATUS_CHANGED,
            tsUrl: CIIMessage.CIIChangeMask.WC_URL_CHANGED,
            wcUrl: CIIMessage.CIIChangeMask.TS_URL_CHANGED,
            timelines: CIIMessage.CIIChangeMask.TIMELINES_CHANGED,
        };

        for (let i = 0; i < CII_KEYS.length; i++) {
            const name = CII_KEYS[i] as keyof CIIMessage;
            if (anotherCII[name] === undefined) {
                retChanges[name] = false;
            } else {
                if (name === "timelines") {
                    retChanges[name] = !CIIMessage.timelinesEqual(this[name] as TimelineProperties[], anotherCII[name] as TimelineProperties[]);
                } else {
                    retChanges[name] = anotherCII[name] !== this[name];
                }

                if (retChanges[name]) {
                    changemask |= CHANGE_MASKS[name];
                }
            }
        }
        return changemask;
    }

    /**
     * Merge properties of this CIIMessage with the supplied CIIMessage.
     * The returned CIIMessage contains all the properties from both. If
     * a property is undefined in the supplied CIIMessage then its value from this
     * message is preserved. If a property is defined in the supplied CIIMessage
     * then that value is taken and the one from this message is ignored.
     *
     * @param newerCII whose defined properties override those of the existing CIIMessage.
     * @return {CIIMessage} that is the result of the merge.
     */
    public merge(newerCII: CIIMessage): CIIMessage {
        const merged: { [key: string]: any } = {};
        const CII_KEYS = [
            "protocolVersion",
            "mrsUrl",
            "contentId",
            "contentIdStatus",
            "presentationStatus",
            "tsUrl",
            "wcUrl",
            "timelines",
        ];

        for (let i = 0; i < CII_KEYS.length; i++) {
            const key = CII_KEYS[i] as keyof CIIMessage;
            if (newerCII[key] !== undefined) {
                merged[key] = newerCII[key];
            } else {
                merged[key] = this[key];
            }
        }

        return new CIIMessage(
            merged.protocolVersion,
            merged.mrsUrl,
            merged.contentId,
            merged.contentIdStatus,
            merged.presentationStatus,
            merged.wcUrl,
            merged.tsUrl,
            merged.timelines
        );
    }
}

export default CIIMessage;