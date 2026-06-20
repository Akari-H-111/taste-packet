/**
 * decoder.ts — Client-side hydration of a 16-byte matrix.
 *
 * The decoder is the "inflation" step.  It reads a raw 16-byte buffer and
 * produces a structured object describing the visual, motion, layout, and
 * social properties of a post preview card.
 *
 * This module runs synchronously in the main thread and never touches the DOM.
 */

import { TasteMatrix, Field } from './matrix.js';
import { InteractionBitmask, type SocialState } from './bitmask.js';

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
  protocolVersion: number;
}

export class TasteDecoder {
  /**
   * Decode a 16-byte buffer into a structured preview card.
   */
  static decode(raw: Uint8Array): PreviewCard {
    if (raw.length !== 16) {
      throw new RangeError(`Expected 16 bytes, got ${raw.length}`);
    }

    const m = new TasteMatrix(raw);

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
      protocolVersion: m.get(Field.ProtocolVersion),
    };
  }
}
