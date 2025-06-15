import { BinarySerialiser} from "../../src/WallClock/BinarySerialiser.js";
import { WallClockServerProtocol } from "../../src/WallClock/WallClockServerProtocol.js";
import { WallClockMessageTypes, WallClockMessage } from "../../src/WallClock/WallClockMessage.js";
import * as clocks from "dvbcss-clocks";

describe("WallClockServerProtocol UDP", () => {
    let wc_server: any;
    let sysClock: clocks.DateNowClock;
    let wallClock: clocks.CorrelatedClock;
    let precision: number;
    let protocolOptions: any;

    beforeAll(() => {
        sysClock = new clocks.DateNowClock();
        wallClock = new clocks.CorrelatedClock(sysClock);

        precision = sysClock.dispersionAtTime(sysClock.now());
        protocolOptions = {
            precision: sysClock.dispersionAtTime(sysClock.now()),
            maxFreqError: sysClock.getRootMaxFreqError(),
            followup: false,
        };

        wc_server = new WallClockServerProtocol(
            wallClock,
            BinarySerialiser,
            protocolOptions
        );
    });

    it("exists", () => {
        expect(WallClockServerProtocol).toBeDefined();
    });

    it("sends a reply after receiving a valid request", () => {
        const wcMsg = new WallClockMessage(0, WallClockMessageTypes.request, 2, 3, 4, 5, 6, 7);
        const msg = BinarySerialiser.pack(wcMsg);
        const routing = { a: 5 };

        const eventHandler = vi.fn();

        wc_server.on("send", eventHandler);
        wc_server.handleMessage(msg, routing);

        expect(eventHandler).toHaveBeenCalled();
        expect(eventHandler.mock.calls.length).toEqual(1);

        const args = eventHandler.mock.calls[0];
        expect(args.length).toEqual(2);
        expect(args[1]).toEqual(routing);
        const reply = BinarySerialiser.unpack(args[0]);
        expect(reply.type).toEqual(WallClockMessageTypes.response);
    });
});
