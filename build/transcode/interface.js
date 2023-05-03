"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarpInterface = void 0;
const utils_1 = require("ethers/lib/utils");
const event_1 = require("../utils/event");
class WarpInterface extends utils_1.Interface {
    decodeWarpEvent(fragment, warpEvent) {
        // reverse 248 bit packing
        const data = (0, event_1.join248bitChunks)(warpEvent.data);
        const keys = (0, event_1.join248bitChunks)(warpEvent.keys);
        // Remove leading 0x from each element and join them
        const chunkedData = `0x${data.map((x) => x.slice(2)).join('')}`;
        return super.decodeEventLog(fragment, chunkedData, keys);
    }
    encodeWarpEvent(fragment, values, order = 0) {
        const { data, topics } = super.encodeEventLog(fragment, values);
        const topicFlatHex = topics.map((x) => x.slice(2).padStart(64, '0')).join('');
        const topicItems248 = (0, event_1.splitInto248BitChunks)(`0x${topicFlatHex}`);
        const dataItems248 = (0, event_1.splitInto248BitChunks)(data);
        return { order, keys: topicItems248, data: dataItems248 };
    }
}
exports.WarpInterface = WarpInterface;
//# sourceMappingURL=interface.js.map