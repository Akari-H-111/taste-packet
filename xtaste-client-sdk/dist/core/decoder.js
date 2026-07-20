/**
 * decoder.ts — Client-side hydration of a 16-byte matrix.
 *
 * The decoder is the "inflation" step.  It reads a raw 16-byte buffer and
 * produces a structured object describing the visual, motion, layout, and
 * social properties of a post preview card.
 *
 * This module runs synchronously in the main thread and never touches the DOM.
 */
import { TasteMatrix } from './matrix.js';
import { InteractionBitmask } from './bitmask.js';
export class TasteDecoder {
    /**
     * Decode a 16-byte buffer into a structured preview card.
     */
    static decode(raw) {
        if (raw.length !== 16) {
            throw new RangeError(`Expected 16 bytes, got ${raw.length}`);
        }
        const m = new TasteMatrix(raw);
        return {
            visual: {
                vertexColors: [
                    m.get(0 /* Field.VertexColorA */),
                    m.get(1 /* Field.VertexColorB */),
                    m.get(2 /* Field.VertexColorC */),
                    m.get(3 /* Field.VertexColorD */),
                ],
            },
            motion: {
                emotionBase: m.get(4 /* Field.EmotionBase */),
                animVelocity: m.get(5 /* Field.AnimVelocity */),
                grainTexture: m.get(6 /* Field.GrainTexture */),
                lightField: m.get(7 /* Field.LightField */),
            },
            layout: {
                spec: m.get(8 /* Field.UILayoutSpec */),
                density: m.get(9 /* Field.ElemDensity */),
                mediaType: m.get(10 /* Field.MediaType */),
                textLength: m.get(11 /* Field.TextLength */),
            },
            state: {
                hotBucket: m.get(12 /* Field.HotBucket */),
                social: InteractionBitmask.decode(m.get(13 /* Field.Interaction */)),
            },
            protocolVersion: m.get(15 /* Field.ProtocolVersion */),
        };
    }
}
