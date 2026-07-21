/**
 * decoder.ts — Client-side hydration of a 16-byte matrix.
 *
 * The decoder is the "inflation" step.  It reads a raw 16-byte buffer and
 * produces a structured object describing the visual, motion, layout, and
 * social properties of a post preview card.
 *
 * This module runs synchronously in the main thread and never touches the DOM.
 */

import {
  TasteMatrix,
  Field,
  PACKET_BYTES,
  PROTOCOL_VERSION,
} from './matrix.js';
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
  /** Return whether a buffer is a supported .taste packet. */
  static supports(raw: Uint8Array): boolean {
    try {
      TasteDecoder.validate(raw);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Decode a 16-byte buffer into a structured preview card.
   */
  static decode(raw: Uint8Array): PreviewCard {
    TasteDecoder.validate(raw);
    const protocolVersion = raw[Field.ProtocolVersion];

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
      protocolVersion,
    };
  }

  private static validate(raw: Uint8Array): void {
    if (!(raw instanceof Uint8Array)) {
      throw new TypeError('Expected a Uint8Array');
    }
    if (raw.length !== PACKET_BYTES) {
      throw new RangeError(`Expected ${PACKET_BYTES} bytes, got ${raw.length}`);
    }
    if (raw[Field.ProtocolVersion] !== PROTOCOL_VERSION) {
      throw new RangeError(`Unsupported protocol version ${raw[Field.ProtocolVersion]}`);
    }

    const layout = raw[Field.UILayoutSpec];
    const density = raw[Field.ElemDensity];
    const mediaType = raw[Field.MediaType];
    const velocity = raw[Field.AnimVelocity];
    const hotBucket = raw[Field.HotBucket];

    if (layout > 3) throw new RangeError(`Invalid UILayoutSpec ${layout} for protocol v1`);
    if (density > 15) throw new RangeError(`Invalid ElemDensity ${density} for protocol v1`);
    if (mediaType > 4) throw new RangeError(`Invalid MediaType ${mediaType} for protocol v1`);
    if (![16, 64, 128, 255].includes(velocity)) {
      throw new RangeError(`Invalid AnimVelocity ${velocity} for protocol v1`);
    }

    const expectedGrain = mediaType === 2 ? 0 : 48;
    if (raw[Field.GrainTexture] !== expectedGrain) {
      throw new RangeError(`Invalid GrainTexture ${raw[Field.GrainTexture]} for protocol v1`);
    }
    if (raw[Field.LightField] !== 128) {
      throw new RangeError(`Invalid LightField ${raw[Field.LightField]} for protocol v1`);
    }
    if (![0, 1, 3, 5, 7, 9, 11, 15].includes(hotBucket)) {
      throw new RangeError(`Invalid HotBucket ${hotBucket} for protocol v1`);
    }
    if (raw[Field.Reserved14] !== 0) {
      throw new RangeError(`Invalid Reserved14 ${raw[Field.Reserved14]} for protocol v1`);
    }
  }
}
