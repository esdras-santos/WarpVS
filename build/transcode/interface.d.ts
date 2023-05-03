import { EventFragment, Interface, Result } from 'ethers/lib/utils';
import { argType, EventItem } from '../utils/event';
export declare class WarpInterface extends Interface {
    decodeWarpEvent(fragment: EventFragment | string, warpEvent: EventItem): Result;
    encodeWarpEvent(fragment: EventFragment, values: argType[], order?: number): EventItem;
}
//# sourceMappingURL=interface.d.ts.map