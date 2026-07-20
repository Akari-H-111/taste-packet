/**
 * decoder.ts — Client-side hydration of a 16-byte matrix.
 *
 * The decoder is the "inflation" step.  It reads a raw 16-byte buffer and
 * produces a structured object describing the visual, motion, layout, and
 * social properties of a post preview card.
 *
 * This module runs synchronously in the main thread and never touches the DOM.
 */
import { TasteMatrix, Field, PACKET_BYTES, PROTOCOL_VERSION, } from './matrix.js';
import { InteractionBitmask } from './bitmask.js';
export class TasteDecoder {
    /** Return whether a buffer is a supported .taste packet. */
    static supports(raw) {
        return raw.length === PACKET_BYTES && raw[Field.ProtocolVersion] === PROTOCOL_VERSION;
    }
    /**
     * Decode a 16-byte buffer into a structured preview card.
     */
    static decode(raw) {
        if (raw.length !== PACKET_BYTES) {
            throw new RangeError(`Expected ${PACKET_BYTES} bytes, got ${raw.length}`);
        }
        const protocolVersion = raw[Field.ProtocolVersion];
        if (protocolVersion !== PROTOCOL_VERSION) {
            throw new RangeError(`Unsupported protocol version ${protocolVersion}`);
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
                emotionBase: m.get(Field.EmotionBase),
                animVelocity: m.get(Field.AnimVelocity),
                grainTexture: m.get(Field.GrainTexture),
                lightField: m.get(Field.LightField),
            },
            layout: {
                spec: m.get(Field.UILayoutSpec),
                density: m.get(Field.ElemDensity),
                mediaType: m.get(Field.MediaType),
                textLength: m.get(Field.TextLength),
            },
            state: {
                hotBucket: m.get(Field.HotBucket),
                social: InteractionBitmask.decode(m.get(Field.Interaction)),
            },
            protocolVersion,
        };
    }
}
