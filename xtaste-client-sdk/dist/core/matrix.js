/**
 * matrix.ts — The fixed-size 16-byte semantic matrix.
 *
 * The matrix is the atomic unit of the .taste protocol.  It is always exactly
 * 16 bytes — never more, never less.  This invariant gives every client a
 * predictable allocation and transport size.
 *
 * Layout (row-major byte indices):
 *
 *   Row 0  Visual Ambiance   │ Byte  0  1  2  3
 *   Row 1  Motion Dynamics    │ Byte  4  5  6  7
 *   Row 2  Layout Skeleton    │ Byte  8  9 10 11
 *   Row 3  State & Versioning │ Byte 12 13 14 15
 */
export const PACKET_BYTES = 16;
export const PROTOCOL_VERSION = 1;
/** Byte offsets for every field in the matrix. */
export var Field;
(function (Field) {
    // Row 0 — Visual Ambiance
    Field[Field["VertexColorA"] = 0] = "VertexColorA";
    Field[Field["VertexColorB"] = 1] = "VertexColorB";
    Field[Field["VertexColorC"] = 2] = "VertexColorC";
    Field[Field["VertexColorD"] = 3] = "VertexColorD";
    // Row 1 — Motion Dynamics
    Field[Field["EmotionBase"] = 4] = "EmotionBase";
    Field[Field["AnimVelocity"] = 5] = "AnimVelocity";
    Field[Field["GrainTexture"] = 6] = "GrainTexture";
    Field[Field["LightField"] = 7] = "LightField";
    // Row 2 — Layout Skeleton
    Field[Field["UILayoutSpec"] = 8] = "UILayoutSpec";
    Field[Field["ElemDensity"] = 9] = "ElemDensity";
    Field[Field["MediaType"] = 10] = "MediaType";
    Field[Field["TextLength"] = 11] = "TextLength";
    // Row 3 — State & Versioning
    Field[Field["HotBucket"] = 12] = "HotBucket";
    Field[Field["Interaction"] = 13] = "Interaction";
    Field[Field["Reserved14"] = 14] = "Reserved14";
    Field[Field["ProtocolVersion"] = 15] = "ProtocolVersion";
})(Field || (Field = {}));
export class TasteMatrix {
    /** The underlying 16-byte buffer. */
    buf;
    constructor(source) {
        if (source) {
            if (source.length !== PACKET_BYTES) {
                throw new RangeError(`TasteMatrix requires exactly ${PACKET_BYTES} bytes, got ${source.length}`);
            }
            this.buf = (source instanceof Uint8Array ? source : new Uint8Array(source));
        }
        else {
            this.buf = new Uint8Array(PACKET_BYTES);
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
