/**
 * matrix.ts — The fixed-size 16-byte semantic matrix.
 *
 * The matrix is the atomic unit of the .taste protocol.  It is always exactly
 * 16 bytes — never more, never less.  This invariant lets us skip all dynamic
 * memory allocation on both server and client, and guarantees that a single
 * UDP datagram can carry dozens of previews without fragmentation.
 *
 * Layout (column-major byte indices):
 *
 *   Row 0  Visual Ambiance   │ Byte  0  1  2  3
 *   Row 1  Motion Dynamics    │ Byte  4  5  6  7
 *   Row 2  Layout Skeleton    │ Byte  8  9 10 11
 *   Row 3  State & Versioning │ Byte 12 13 14 15
 */
export class TasteMatrix {
    /** The underlying 16-byte buffer. */
    buf;
    constructor(source) {
        if (source) {
            if (source.length !== 16) {
                throw new RangeError(`TasteMatrix requires exactly 16 bytes, got ${source.length}`);
            }
            this.buf = source instanceof Uint8Array ? source : new Uint8Array(source);
        }
        else {
            this.buf = new Uint8Array(16);
        }
    }
    /** Read a single field. */
    get(field) {
        return this.buf[field];
    }
    /** Write a single field. */
    set(field, value) {
        this.buf[field] = value & 0xff;
    }
    /** Return the row at the given index (0-3) as a 4-byte slice. */
    row(index) {
        const start = index * 4;
        return this.buf.slice(start, start + 4);
    }
}
