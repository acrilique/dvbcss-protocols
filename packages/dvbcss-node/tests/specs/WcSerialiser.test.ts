import { BinarySerialiser, JsonSerialiser,WallClockMessageTypes, WallClockMessage  } from "../../";

const makeBinaryMsg = (arrayByteNumbers: number[]): Uint8Array => {
    const binarymsg = new Uint8Array(32);
    const d = new DataView(binarymsg.buffer);
    for (let i = 0; i < 32; i++) {
        d.setUint8(i, arrayByteNumbers[i]);
    }
    return binarymsg;
}

const isBinaryMsgEqual = (expected: Uint8Array, actual: ArrayBuffer): boolean | string => {
    const actualUint8 = new Uint8Array(actual);
    if (expected.length !== actualUint8.length) {
        return `Length mismatch: expected.length=${expected.length} vs actual.length=${actualUint8.length}`;
    }
    for (let i = 0; i < expected.length; i++) {
        if (expected[i] !== actualUint8[i]) {
            return `Value mismatch: expected[${i}]=${expected[i]} vs actual[${i}]=${actualUint8[i]}`;
        }
    }
    return true;
}

describe("JsonSerialiser", () => {
    it("exists", () => {
        expect(JsonSerialiser).toBeDefined();
    });

    it("serialises and deserialises correctly a simple message", () => {
        const msg = new WallClockMessage(0, WallClockMessageTypes.request, 1, 256.7, 2000, 145245, 3000.35, 4000.12345);
        expect(JsonSerialiser.pack(msg)).toEqual(JSON.stringify({
            v: 0,
            t: 0,
            p: 1,
            mfe: 256.7,
            otvs: 2000,
            otvn: 145245,
            rt: 3000.35,
            tt: 4000.12345
        }));

        expect(JsonSerialiser.unpack(JsonSerialiser.pack(msg))).toEqual(msg);
    });

    it("serialises and deserialises correctly a different message", () => {
        const msg = new WallClockMessage(0, WallClockMessageTypes.responseWithFollowUp, 0.000001, 32.51, 3993932000, 145245, 3000.35, 4000.12345);
        expect(JsonSerialiser.pack(msg)).toEqual(JSON.stringify({
            v: 0,
            t: 2,
            p: 0.000001,
            mfe: 32.51,
            otvs: 3993932000,
            otvn: 145245,
            rt: 3000.35,
            tt: 4000.12345
        }));

        expect(JsonSerialiser.unpack(JsonSerialiser.pack(msg))).toEqual(msg);
    });
});

describe("BinarySerialiser", () => {
    it("exists", () => {
        expect(BinarySerialiser).toBeDefined();
    });

    it("serialises and deserialises correctly even with an unusual originate_timevalue", () => {
        const msg = new WallClockMessage(0, WallClockMessageTypes.response, 8, 500, 0xaabbccdd, 0xeeff1122, 2000, 3000);
        const packedMsg = BinarySerialiser.pack(msg);
        const expectedPackedMsg = makeBinaryMsg([0x00, 0x01, 0x03, 0x00, 0x00, 0x01, 0xf4, 0x00, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x11, 0x22, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0xd0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0b, 0xb8]);
        expect(isBinaryMsgEqual(expectedPackedMsg, packedMsg as ArrayBuffer)).toBe(true);
    });
});
