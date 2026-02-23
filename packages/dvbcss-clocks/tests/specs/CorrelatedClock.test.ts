/****************************************************************************
 * Copyright 2017 British Broadcasting Corporation
 * and contributions Copyright 2017 British Telecommunications (BT) PLC.
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
 *
 * --------------------------------------------------------------------------
 * Summary of parts containing contributions:
 *   by British Telecommunications (BT) PLC:
 *     test "can convert a time to that of its parent"
 *     test "can convert a time from that of its parent"
 *     test "A change of speed to 0 prevent advancing of a timer works"
 *     test "A change of speed of the root clock to advance of a timer works"
*****************************************************************************/

import CorrelatedClock from "../../src/CorrelatedClock.js";
import DateNowClock from "../../src/DateNowClock.js";
import Correlation from "../../src/Correlation.js";
import { vi } from 'vitest';

describe("CorrelatedClock", function() {
	it("exists", function() {
		expect(CorrelatedClock).toBeDefined();
	});

    it("takes a parent clock as an argument", function() {
        var root = new DateNowClock();
        var cc = new CorrelatedClock(root);
        expect(cc.parent).toBe(root);
    });
    
    it("defaults to a speed of 1.0, tick rate of 1kHz and Correlation(0,0,0,0)", function() {
        var root = new DateNowClock();
        var cc = new CorrelatedClock(root);
        expect(cc.tickRate).toBe(1000);
        expect(cc.speed).toBe(1);
        expect(cc.correlation).toEqual(new Correlation(0,0,0,0));
    });
    
    it("can be configured with alternative speed, tick rate and correlation at creation", function() {
        var root = new DateNowClock();
        var cc = new CorrelatedClock(root, {
            speed: 2,
            tickRate: 5000,
            correlation: new Correlation(1,2,3,4)
        });
        expect(cc.tickRate).toBe(5000);
        expect(cc.speed).toBe(2);
        expect(cc.correlation).toEqual(new Correlation(1,2,3,4));
    });
    
    
    it("ticks at the specified rate and speed", function() {
        var datenow = vi.spyOn(Date,"now");

        var root = new DateNowClock({tickRate:1000000});
        datenow.mockReturnValue(5020.8*1000);

        var c = new CorrelatedClock(root, {
            tickRate: 1000,
            correlation: new Correlation(0,300)
        });
        expect(c.now()).toBe(5020.8*1000 + 300);
        
        datenow.mockReturnValue((5020.8+22.7)*1000);
        expect(c.now()).toBe((5020.8+22.7)*1000 + 300);
    });
    
    it("adjusts if the correlation is changed", function() {
        var datenow = vi.spyOn(Date,"now");

        var root = new DateNowClock({tickRate:1000000});
        datenow.mockReturnValue(5020.8*1000);

        var c = new CorrelatedClock(root, {
            tickRate: 1000,
            correlation: new Correlation(0,300)
        });
        expect(c.now()).toBe(5020.8*1000 + 300);
        
        c.correlation = new Correlation(50000, 320);
        expect(c.correlation).toEqual(new Correlation(50000, 320));
        expect(c.now()).toBe(((5020.8*1000000) - 50000) / 1000 + 320);
    });
    
    it("emits a 'change' event when the correlation, speed or tick rate are changed", function() {
        var root = new DateNowClock();
        var c = new CorrelatedClock(root);
        
        var callback = vi.fn();
        c.on("change", callback);
        
        expect(callback).not.toHaveBeenCalled();
        
        c.correlation = new Correlation(1,2);
        expect(callback).toHaveBeenCalledWith(c);
        callback.mockClear();

        c.speed = 5.0;
        expect(callback).toHaveBeenCalledWith(c);
        callback.mockClear();

        c.tickRate = 999;
        expect(callback).toHaveBeenCalledWith(c);
        callback.mockClear();

    });
    
    it("emits a 'change' event in response to its parent emitting a 'change' event", function() {
        var root = new DateNowClock();
        var c = new CorrelatedClock(root);
        var cc = new CorrelatedClock(c);
        
        var callback0 = vi.fn();
        var callback1 = vi.fn();
        var callback2 = vi.fn();
        root.on("change", callback0);
        c.on("change", callback1);
        cc.on("change", callback2);
        
        root.emit("change",root);
        expect(callback0).toHaveBeenCalledWith(root);
        expect(callback1).toHaveBeenCalledWith(c);
        expect(callback2).toHaveBeenCalledWith(cc);
        callback0.mockClear();
        callback1.mockClear();
        callback2.mockClear();
        
        c.emit("change",c);
        expect(callback0).not.toHaveBeenCalled();
        expect(callback1).toHaveBeenCalledWith(c);
        expect(callback2).toHaveBeenCalledWith(cc);
        callback0.mockClear();
        callback1.mockClear();
        callback2.mockClear();
        
        cc.emit("change",cc);
        expect(callback0).not.toHaveBeenCalled();
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalledWith(cc);
        callback0.mockClear();
        callback1.mockClear();
        callback2.mockClear();
    });

    it("can rebase by recalculating the correlation to align with a particular time", function() {
        var root = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(root,{
            tickRate:1000,
            correlation:new Correlation(50,300)
        });
        
        c.rebaseCorrelationAt(400);
        expect(c.correlation).toEqual(new Correlation(150,400));
    });
    
    it("can convert a time to that of its parent", function() {
        var datenow = vi.spyOn(Date,"now");

        var root = new DateNowClock({tickRate:2000000});
        datenow.mockReturnValue(1000*1000);

        var c = new CorrelatedClock(root, {
            tickRate: 1000,
            correlation: new Correlation(50,300)
        });
        
        expect(c.toParentTime(400)).toEqual(50 + (400-300)*2000);

        c = new CorrelatedClock(root, {
            tickRate: 1000,
            correlation: new Correlation(50,300),
            speed: 0
        });
        expect(c.toParentTime(300)).toEqual(50);
        expect(c.toParentTime(400)).toBeNaN();
    });
    
    it("can convert a time from that of its parent", function() {
        var datenow = vi.spyOn(Date,"now");

        var root = new DateNowClock({tickRate:2000000});
        datenow.mockReturnValue(1000*1000);

        var c = new CorrelatedClock(root, {
            tickRate: 1000,
            correlation: new Correlation(50,300)
        });
        
        expect(c.fromParentTime(50 + (400-300)*2000)).toEqual(400);

        c = new CorrelatedClock(root, {
            tickRate: 1000,
            correlation: new Correlation(50,300),
            speed: 0
        });
        expect(c.fromParentTime(50)).toEqual(300);
        expect(c.fromParentTime(100)).toEqual(300);
    });
    
    it("can return its parent", function() {
        var root = new DateNowClock();
        var c = new CorrelatedClock(root);
        expect(c.parent).toBe(root);
    });
    
    it("can return the root clock", function() {
        var root = new DateNowClock();
        var b = new CorrelatedClock(root);
        var c = new CorrelatedClock(b);
        var d = new CorrelatedClock(c);
        
        expect(root.getRoot()).toBe(root);        
        expect(b.getRoot()).toBe(root);        
        expect(c.getRoot()).toBe(root);        
        expect(d.getRoot()).toBe(root);        
    });
    
    it("can set correlation and speed atomically", function() {
        var root = new DateNowClock();
        var b = new CorrelatedClock(root);

        var callback0 = vi.fn();
        b.on("change",callback0);
        
        expect(callback0).not.toHaveBeenCalled();
        
        b.setCorrelationAndSpeed(new Correlation(5,6), 2.6);
        
        expect(callback0.mock.calls.length).toEqual(1);
    });
    
    it("can quantify the change resulting from a change of correlation or speed", function() {
        var root = new DateNowClock({tickRate:1000000});
        var b = new CorrelatedClock(root, {
            tickRate: 1000,
            correlation: new Correlation(0,0),
            speed: 1.0
        });

        expect(b.quantifyChange(new Correlation(0,0), 1.01)).toEqual(Number.POSITIVE_INFINITY);
        
        b.speed = 0.0;
        expect(b.quantifyChange(new Correlation(0, 5), 0.0)).toEqual(0.005);
    });
	
	it("Can set correlation during construction using an array of values or an object with keys", function() {
		var root = new DateNowClock();

		var c = new CorrelatedClock(root, {correlation:[1,2,3,4]});
		expect(c.correlation).toEqual(new Correlation(1,2,3,4));
		
		c = new CorrelatedClock(root, {correlation:{parentTime:5, childTime:6, initialError:7, errorGrowthRate:8}});
		expect(c.correlation).toEqual(new Correlation(5,6,7,8));
	});

	it("Can set correlation using an array of values or an object with keys", function() {
		var root = new DateNowClock();
		var c = new CorrelatedClock(root);
		
		c.correlation = new Correlation([1,2,3,4]);
		expect(c.correlation).toEqual(new Correlation(1,2,3,4));
		
		c.correlation = new Correlation({parentTime:5, childTime:6, initialError:7, errorGrowthRate:8});
		expect(c.correlation).toEqual(new Correlation(5,6,7,8));
	});
});



describe("CorrelatedClock - setTimeout, clearTimeout", function() {
    
    beforeEach(function() {
        vi.useFakeTimers();
    });
    
    afterEach(function() {
        vi.useRealTimers();
    });
    
    it("Can schedule a timeout callback with arguments", function() {
        var dateNowSpy = vi.spyOn(Date, 'now');
        var callback = vi.fn();
        
        var dnc = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(dnc, {tickRate:1000,correlation:new Correlation(0,100)});

        dateNowSpy.mockReturnValue(500);
        c.setTimeout(callback, 1000, "hello");
        
        dateNowSpy.mockReturnValue(500+999);
        vi.advanceTimersByTime(999);
        expect(callback).not.toHaveBeenCalled();
        
        dateNowSpy.mockReturnValue(500+1000);
        vi.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledWith("hello");
    });
    
    it("A change of correlation to delay a timer works",function() {
        var dateNowSpy = vi.spyOn(Date, 'now');
        var callback = vi.fn();
        
        var dnc = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(dnc, {tickRate:1000,correlation:new Correlation(0,100)});

        dateNowSpy.mockReturnValue(500);
        c.setTimeout(callback, 1000, "hello");

        dateNowSpy.mockReturnValue(500+999);
        vi.advanceTimersByTime(999);
        expect(callback).not.toHaveBeenCalled();

        c.setCorrelation(new Correlation(0,50));
        dateNowSpy.mockReturnValue(500+1049);
        vi.advanceTimersByTime(50);
        expect(callback).not.toHaveBeenCalled();

        dateNowSpy.mockReturnValue(500+1050);
        vi.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledWith("hello");
    });

    it("A change of correlation to advance a timer works", function() {
        var dateNowSpy = vi.spyOn(Date, 'now');
        var callback = vi.fn();
        
        var dnc = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(dnc, {tickRate:1000,correlation:new Correlation(0,100)});

        dateNowSpy.mockReturnValue(500);
        c.setTimeout(callback, 1000, "hello");

        dateNowSpy.mockReturnValue(500+999);
        vi.advanceTimersByTime(999);
        expect(callback).not.toHaveBeenCalled();

        c.setCorrelation(new Correlation(0,102));
        vi.advanceTimersByTime(0);
        expect(callback).toHaveBeenCalledWith("hello");
        
    });

    it("A change of speed to 0 prevent advancing of a timer works", function() {
        var dateNowSpy = vi.spyOn(Date, 'now');
        var callback = vi.fn();

        var dnc = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(dnc, {tickRate:1000,correlation:new Correlation(0,100)});

        dateNowSpy.mockReturnValue(500);
        c.setTimeout(callback, 1000, "hello");

        dateNowSpy.mockReturnValue(500+999);
        vi.advanceTimersByTime(999);
        expect(callback).not.toHaveBeenCalled();

        c.setSpeed(0);
        dateNowSpy.mockReturnValue(500+999+10000);
        vi.advanceTimersByTime(10000);
        expect(callback).not.toHaveBeenCalled();

        c.setSpeed(1);
        dateNowSpy.mockReturnValue(500+999+10000+1);
        vi.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledWith("hello");
    });

    it("A change of speed of the root clock to advance of a timer works", function() {
        var dateNowSpy = vi.spyOn(Date, 'now');
        var callback = vi.fn();

        var dnc = new DateNowClock({tickRate:1000});
        dnc.getSpeed = function() { return 0.5; };
        var c = new CorrelatedClock(dnc, {tickRate:1000,correlation:new Correlation(0,100)});

        dateNowSpy.mockReturnValue(500);
        c.setTimeout(callback, 1000, "hello");

        dateNowSpy.mockReturnValue(500+999);
        vi.advanceTimersByTime(999*2);
        expect(callback).not.toHaveBeenCalled();

        dateNowSpy.mockReturnValue(500+999+1);
        vi.advanceTimersByTime(1*2);
        expect(callback).toHaveBeenCalledWith("hello");
    });

	it("reports the same dispersion as its parent when the correlation specifies zero error contribution", function() {
        var dnc = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(dnc, {tickRate:1000,correlation:new Correlation(0,0)});
		expect(c.dispersionAtTime(10)).toEqual(dnc.dispersionAtTime(10));
		expect(c.dispersionAtTime(20)).toEqual(dnc.dispersionAtTime(20));		
	});
	
	it("reports a greater dispersion than its parent when the correlation specified non zero error contribution, and it does so for times on both sides of the correlation (before and after the point of correlation)", function() {
        var dnc = new DateNowClock({tickRate:1000});
        var c = new CorrelatedClock(dnc, {tickRate:1000,correlation:new Correlation(0, 0, 0.5, 0.1)});
		expect(c.dispersionAtTime(10)).toEqual(dnc.dispersionAtTime(10) + 0.5 + 0.1*10/1000);
		expect(c.dispersionAtTime(20)).toEqual(dnc.dispersionAtTime(20) + 0.5 + 0.1*20/1000);
		expect(c.dispersionAtTime(-10)).toEqual(dnc.dispersionAtTime(-10) + 0.5 + 0.1*10/1000);
	});

	it("reports NaN when now() is called if it has no parent", function() {
		var c = new CorrelatedClock(new DateNowClock());
        c.setParent(null);
		expect(isNaN(c.now())).toBeTruthy();
	});
	
	it("reports NaN when using toParentTime if it has no parent", function() {
		var c = new CorrelatedClock(new DateNowClock());
        c.setParent(null);
		expect(isNaN(c.toParentTime(5))).toBeTruthy();
	});

	it("reports NaN when using fromParentTime if it has no parent", function() {
		var c = new CorrelatedClock(new DateNowClock());
        c.setParent(null);
		expect(isNaN(c.fromParentTime(5))).toBeTruthy();
	});
});
