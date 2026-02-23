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

import OffsetClock from "../../src/OffsetClock.js";
import CorrelatedClock from "../../src/CorrelatedClock.js";
import DateNowClock from "../../src/DateNowClock.js";

describe("OffsetClock", () => {

    it("exists", () => {
        expect(OffsetClock).toBeDefined();
    });

    it("takes a parent clock as an argument", () => {
        const root = new DateNowClock();
        const oc = new OffsetClock(root);
        expect(oc.parent).toBe(root);
    });

    it("defaults to an offset of zero", () => {
        const root = new DateNowClock();
        const oc = new OffsetClock(root);
        expect(oc.offset).toBe(0);
    });

    it("can be configured with an offset at creation by specifying an 'offset' property of the 2nd argument.", () => {
        const root = new DateNowClock();
        const oc = new OffsetClock(root, {"offset":75});
        expect(oc.offset).toBe(75);
    });

    it("has speed 1 and cannot be changed", () => {
        const root = new DateNowClock();
        const oc = new OffsetClock(root, {"offset":75});
        expect(oc.speed).toEqual(1);
        expect(oc.getSpeed()).toEqual(1);

        expect(() => { oc.speed = 5; }).toThrow();
        expect(oc.speed).toEqual(1);
        expect(oc.getSpeed()).toEqual(1);

        expect(() => { oc.setSpeed(5); }).toThrow();
        expect(oc.speed).toEqual(1);
        expect(oc.getSpeed()).toEqual(1);
    });

    it("has tick rate of the parent and cannot be changed", () => {
        const root = new DateNowClock();
        const oc = new OffsetClock(root, {"offset":75});
        expect(oc.tickRate).toEqual(root.tickRate);
        expect(oc.getTickRate()).toEqual(root.tickRate);

        expect(() => { oc.tickRate = 5; }).toThrow();
        expect(oc.tickRate).toEqual(root.tickRate);
        expect(oc.getTickRate()).toEqual(root.tickRate);

        expect(() => { oc.setTickRate(5); }).toThrow();
        expect(oc.tickRate).toEqual(root.tickRate);
        expect(oc.getTickRate()).toEqual(root.tickRate);
    });

    it("still has speed 1 even if parent speed is not 1", () => {
        const root = new DateNowClock();
        const cc = new CorrelatedClock(root, {tickRate:1000});
        const oc = new OffsetClock(cc, {offset:50});

        cc.speed = 5;
        expect(oc.speed).toEqual(1);
    });

    describe("offset behaviour is expected to work as follows:", () => {

        let root: DateNowClock;
        let parent: CorrelatedClock;
        let altParent: CorrelatedClock;

        beforeEach(() => {
            vi.useFakeTimers();
            root = new DateNowClock();
            parent = new CorrelatedClock(root, {tickRate:1000});
            altParent = new CorrelatedClock(root, {tickRate:50});
            parent.speed = 1;
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("correctly applies the offset when effectivespeed of parent is 1", () => {
            const OC_AHEAD_BY=50;

            const oc = new OffsetClock(parent, {"offset":OC_AHEAD_BY});
            parent.speed = 1;

            const t = oc.now();

            // advance time and see if OffsetClock was indeed ahead by OC_AHEAD_BY milliseconds
            vi.advanceTimersByTime(OC_AHEAD_BY);
            const t2 = parent.now();
            expect(t).toEqual(t2);
        });

        it("correctly applies the offset (by scaling it to nothing) when effective speed of parent is 0", () => {
            const OC_AHEAD_BY=98;

            const oc = new OffsetClock(parent, {"offset":OC_AHEAD_BY});
            parent.speed = 0;

            const t = oc.now();

            // advance time and see if OffsetClock was indeed ahead by OC_AHEAD_BY milliseconds
            vi.advanceTimersByTime(OC_AHEAD_BY);
            const t2 = parent.now();
            expect(t).toEqual(t2);
        });

        it("correctly applies the offset (by scaling it proportional to teh speed) when effective speed of parent is > 1", () => {
            const OC_AHEAD_BY=20;

            const oc = new OffsetClock(parent, {"offset":OC_AHEAD_BY});
            parent.speed = 2.7;

            const t = oc.now();

            // advance time and see if OffsetClock was indeed ahead by OC_AHEAD_BY milliseconds
            vi.advanceTimersByTime(OC_AHEAD_BY);
            const t2 = parent.now();
            expect(t).toBeCloseTo(t2);
        });

        it("correctly applies no offset if set to zero", () => {
            const oc = new OffsetClock(parent, {"offset":0});
            expect(oc.now()).toEqual(parent.now());
        });

        it("will allow the offset to be changed", () => {
            const oc = new OffsetClock(parent, {"offset":40});
            expect(oc.now()).toEqual(parent.now() + 40);
            oc.offset = 65;
            expect(oc.now()).toEqual(parent.now() + 65);
        });

        it("will still correctly apply the offset if the parent is changed", () => {
            const oc = new OffsetClock(parent, {"offset":40});
            expect(oc.getParent()).toEqual(parent);
            expect(oc.now()).toEqual(parent.now() + 40);
            oc.setParent(altParent);
            expect(oc.getParent()).toEqual(altParent);
            expect(oc.now()).toEqual(altParent.now() + 2);
        });

        it("causes a notification if the parent is changed", () => {
            const oc = new OffsetClock(parent, {"offset":40});
            const dep = vi.fn();
            oc.on("change", dep);
            expect(dep).not.toHaveBeenCalled();
            oc.setParent(altParent);
            expect(dep).toHaveBeenCalledWith(oc);
        });

        it("correctly applies the offset if it is negative", () => {
            const OC_BEHIND_BY = 50;

            const oc = new OffsetClock(parent, {"offset":OC_BEHIND_BY});
            parent.speed = 1;

            const t = oc.now();

            // advance time and see if OffsetClock was indeed ahead by OC_AHEAD_BY milliseconds
            vi.advanceTimersByTime(OC_BEHIND_BY);
            const t2 = parent.now();
            expect(t).toBeCloseTo(t2);
        });

        it("correctly converts to root time", () => {
            const OC_AHEAD_BY = 124;
            const oc = new OffsetClock(parent, {offset:OC_AHEAD_BY});
            const t = 1285.2;
            const rt = oc.toRootTime(t);
            const rt2 = parent.toRootTime(t);
            expect(rt + OC_AHEAD_BY/1000*root.tickRate).toEqual(rt2);
        });

        it("correctly converts from root time", () => {
            const OC_AHEAD_BY = 124;
            const oc = new OffsetClock(parent, {offset:OC_AHEAD_BY});
            const rt = 22849128;
            const t = oc.fromRootTime(rt);
            const t2 = parent.fromRootTime(rt + OC_AHEAD_BY/1000*root.tickRate);
            expect(t).toEqual(t2);
        });

    });

});
