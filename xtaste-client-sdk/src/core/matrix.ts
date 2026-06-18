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
 *   Row 3  State & Security   │ Byte 12 13 14 15
 */

/** A 16-byte buffer representing a single .taste matrix. */
export type MatrixBuffer = Uint8Array & { readonly length: 16 };

/** Byte offsets for every field in the matrix. */
export const enum Field {
  // Row 0 — Visual Ambiance
  VertexColorA  =  0,
  VertexColorB  =  1,
  VertexColorC  =  2,
  VertexColorD  =  3,

  // Row 1 — Motion Dynamics
  EmotionBase   =  4,
  AnimVelocity  =  5,
  GrainTexture  =  6,
  LightField    =  7,

  // Row 2 — Layout Skeleton
  UILayoutSpec  =  8,
  ElemDensity   =  9,
  MediaType     = 10,
  TextLength    = 11,

  // Row 3 — State & Security
  HotBucket     = 12,
  Interaction   = 13,
  SafetyCode14  = 14,
  SafetyCode15  = 15,
}

export class TasteMatrix {
  /** The underlying 16-byte buffer. */
  public readonly buf: Uint8Array;

  constructor(source?: Uint8Array | number[]) {
    if (source) {
      if (source.length !== 16) {
        throw new RangeError(
          `TasteMatrix requires exactly 16 bytes, got ${source.length}`
        );
      }
      this.buf = source instanceof Uint8Array ? source : new Uint8Array(source);
    } else {
      this.buf = new Uint8Array(16);
    }
  }

  /** Read a single field. */
  get(field: Field): number {
    return this.buf[field];
  }

  /** Write a single field. */
  set(field: Field, value: number): void {
    this.buf[field] = value & 0xff;
  }

  /** Return a hex dump suitable for logging. */
  toHex(): string {
    return Array.from(this.buf)
      .map((b) => '0x' + b.toString(16).padStart(2, '0'))
      .join(' ');
  }

  /** Clone into a fresh buffer. */
  clone(): TasteMatrix {
    return new TasteMatrix(new Uint8Array(this.buf));
  }

  /** Return the row at the given index (0-3) as a 4-byte slice. */
  row(index: 0 | 1 | 2 | 3): Uint8Array {
    const start = index * 4;
    return this.buf.slice(start, start + 4);
  }
}
