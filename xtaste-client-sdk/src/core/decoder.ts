/**
 * decoder.ts — Client-side hydration of a 16-byte matrix.
 *
 * The decoder is the "inflation" step.  It reads a raw 16-byte buffer and
 * produces a structured object describing the visual, motion, layout, and
 * social properties of a post preview card.
 *
 * This module runs in a Web Worker or background thread.  It never touches
 * the DOM and never allocates beyond the output object.
 */

import { TasteMatrix, Field } from './matrix.js';
import { InteractionBitmask, type SocialState } from './bitmask.js';
import { TasteSecurity, CorruptedField } from './security.js';

/** The fully hydrated preview card description. */
export interface PreviewCard {
  visual: {
    vertexColors: [number, number, number, number];
  };
  motion: {
    emotionBase:  number;   // 0–255
    animVelocity: number;   // 0–255
    grainTexture: number;   // 0–255
    lightField:   number;   // 0–255
  };
  layout: {
    spec:         number;
    density:      number;
    mediaType:    number;
    textLength:   number;
  };
  state: {
    hotBucket:    number;
    social:       SocialState;
  };
  integrity: {
    valid:        boolean;
    recovered:    CorruptedField[];
  };
}

export class TasteDecoder {
  /**
   * Decode a 16-byte buffer into a structured preview card.
   *
   * If the integrity check fails, the decoder attempts automatic recovery
   * before returning.  The `integrity.recovered` array records which fields
   * were repaired.
   */
  static decode(raw: Uint8Array): PreviewCard {
    if (raw.length !== 16) {
      throw new RangeError(`Expected 16 bytes, got ${raw.length}`);
    }

    // Work on a copy so the caller keeps ownership of the original.
    const buf = new Uint8Array(raw);
    const recovered: CorruptedField[] = [];

    // ── Integrity check & self-healing ─────────────────────────────────
    if (!TasteSecurity.verify(buf)) {
      // Try recovering both columns.  Because the parity codes are
      // orthogonal, this is always safe — even if only one column is
      // damaged, the other recovery is a harmless no-op.
      TasteSecurity.recoverDual(buf);

      if (TasteSecurity.verify(buf)) {
        // Determine which fields were actually repaired by comparing
        // against the original input.
        if (raw[2] !== buf[2])   recovered.push(CorruptedField.VertexColorC);
        if (raw[13] !== buf[13]) recovered.push(CorruptedField.Interaction);
      }
    }

    const m = new TasteMatrix(buf);

    return {
      visual: {
        vertexColors: [
          m.get(Field.VertexColorA),
          m.get(Field.VertexColorB),
          m.get(Field.VertexColorC),
          m.get(Field.VertexColorD),
        ],
      },
      motion: {
        emotionBase:  m.get(Field.EmotionBase),
        animVelocity: m.get(Field.AnimVelocity),
        grainTexture: m.get(Field.GrainTexture),
        lightField:   m.get(Field.LightField),
      },
      layout: {
        spec:       m.get(Field.UILayoutSpec),
        density:    m.get(Field.ElemDensity),
        mediaType:  m.get(Field.MediaType),
        textLength: m.get(Field.TextLength),
      },
      state: {
        hotBucket: m.get(Field.HotBucket),
        social:    InteractionBitmask.decode(m.get(Field.Interaction)),
      },
      integrity: {
        valid: TasteSecurity.verify(buf),
        recovered,
      },
    };
  }
}
