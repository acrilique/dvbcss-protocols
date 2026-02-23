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

import ClockBase from "../../src/ClockBase.js";

describe("ClockBase", () => {
    it("exists", () => {
        expect(ClockBase).toBeDefined();
    });


    /**
        most other code cannot be tested here because it relies on
        methods that wil be implemented in subclasses. But we can check the
        properties:
    **/

    it("calls through to get/set methods when tickRate, speed, availabilityFlag, parent properties are gotten or set", () => {
        const c = new ClockBase();
        let spy;
        let _;

        spy = vi.spyOn(c, "getTickRate").mockReturnValue(0);
        _ = c.tickRate;
        expect(spy).toHaveBeenCalled();

        spy = vi.spyOn(c, "getSpeed").mockReturnValue(0);
        _ = c.speed;
        expect(spy).toHaveBeenCalled();

        spy = vi.spyOn(c, "getAvailabilityFlag").mockReturnValue(false);
        _ = c.availabilityFlag;
        expect(spy).toHaveBeenCalled();

        spy = vi.spyOn(c, "getParent").mockReturnValue(null);
        _ = c.parent;
        expect(spy).toHaveBeenCalled();

        spy = vi.spyOn(c,"setTickRate").mockImplementation(() => {});
        c.tickRate = 5;
        expect(spy).toHaveBeenCalledWith(5);

        spy = vi.spyOn(c,"setSpeed").mockImplementation(() => {});
        c.speed = 2;
        expect(spy).toHaveBeenCalledWith(2);

        spy = vi.spyOn(c,"setAvailabilityFlag").mockImplementation(() => {});
        c.availabilityFlag = false;
        expect(spy).toHaveBeenCalledWith(false);

        spy = vi.spyOn(c,"setParent").mockImplementation(() => {});
        const parentClock = new ClockBase();
        c.parent = parentClock;
        expect(spy).toHaveBeenCalledWith(parentClock);

    });
});
