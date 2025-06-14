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
 * @memberof dvbcss-protocols.CII

 * Object representing properties for an available timeline signalled in a CII message.
 */
export class TimelineProperties {
    /**
     * The timeline selector for this timeline
     */
    public timelineSelector: string;
    /**
     * The denominator of the tick rate
     */
    public unitsPerTick: number;
    /**
     * The numerator of the tick rate
     */
    public unitsPerSecond: number;
    /**
     * Indication of timeline accuracy
     */
    public accuracy?: number;

    /**
     * @param timelineSelector The timeline selector for this timeline
     * @param unitsPerTick The denominator of the tick rate
     * @param unitsPerSecond The numerator of the tick rate
     * @param accuracy Indication of timeline accuracy, or `undefined`
     */
    constructor(timelineSelector: string, unitsPerTick: number, unitsPerSecond: number, accuracy?: number) {
        this.timelineSelector = timelineSelector;
        this.unitsPerTick = Number(unitsPerTick);
        this.unitsPerSecond = Number(unitsPerSecond);
        this.accuracy = Number(accuracy);
    }

    /**
     * Create a {TimelineProperties} object from a plain Javascript object with the same properties.
     * @param o An object with the same properties as a TimelineProperties object.
     * @returns {TimelineProperties} with the same properties as the object passed as the argument
     */
    public static getFromObj(o: any): TimelineProperties {
        return new TimelineProperties(
            o.timelineSelector,
            typeof o.timelineProperties !== 'undefined' ? o.timelineProperties.unitsPerTick : o.unitsPerTick,
            typeof o.timelineProperties !== 'undefined' ? o.timelineProperties.unitsPerSecond : o.unitsPerSecond,
            typeof o.timelineProperties !== 'undefined' ? o.timelineProperties.accuracy : o.accuracy
        );
    }

    /**
     * Serialise to JSON
     * @returns {String} JSON representation of these timeline properties
     */
    public serialise(): string {
        return JSON.stringify(this);
    }

    /**
     * Parse a JSON representation of timeline properties.
     * @param jsonVal The timeline properties encoded as JSON.
     * @returns {TimelineProperties} with the same properties as the JSON§ passed as the argument
     */
    public static deserialise(jsonVal: string | ArrayBuffer): TimelineProperties {
        // coerce from arraybuffer,if needed
        if (jsonVal instanceof ArrayBuffer) {
            jsonVal = String.fromCharCode.apply(null, new Uint8Array(jsonVal) as any);
        }
        const o = JSON.parse(jsonVal as string);

        return new TimelineProperties(o.timelineSelector, o.unitsPerTick, o.unitsPerSecond, o.accuracy);
    }

    public equals(obj: any): boolean {
        return obj instanceof Object &&
            this.timelineSelector === obj.timelineSelector &&
            (this.unitsPerTick === obj.unitsPerTick ||
                (isNaN(this.unitsPerTick) && isNaN(obj.unitsPerTick))) &&
            (this.unitsPerSecond === obj.unitsPerSecond ||
                (isNaN(this.unitsPerSecond) && isNaN(obj.unitsPerSecond))) &&
            (this.accuracy === obj.accuracy ||
                (this.accuracy !== undefined && obj.accuracy !== undefined && isNaN(this.accuracy) && isNaN(obj.accuracy)))
    }
}

export default TimelineProperties;