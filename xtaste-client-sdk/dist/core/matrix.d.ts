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
/** A 16-byte buffer representing a single .taste matrix. */
export type MatrixBuffer = Uint8Array & {
    readonly length: 16;
};
/** Byte offsets for every field in the matrix. */
export declare const enum Field {
    VertexColorA = 0,
    VertexColorB = 1,
    VertexColorC = 2,
    VertexColorD = 3,
    EmotionBase = 4,
    AnimVelocity = 5,
    GrainTexture = 6,
    LightField = 7,
    UILayoutSpec = 8,
    ElemDensity = 9,
    MediaType = 10,
    TextLength = 11,
    HotBucket = 12,
    Interaction = 13,
    Reserved14 = 14,
    ProtocolVersion = 15
}
export declare class TasteMatrix {
    /** The underlying 16-byte buffer. */
    readonly buf: Uint8Array;
    constructor(source?: Uint8Array | number[]);
    /** Read a single field. */
    get(field: Field): number;
    /** Write a single field. */
    set(field: Field, value: number): void;
    /** Return the row at the given index (0-3) as a 4-byte slice. */
    row(index: 0 | 1 | 2 | 3): Uint8Array;
}
