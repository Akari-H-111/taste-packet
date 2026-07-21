/**
 * decoder.ts — Client-side hydration of a 16-byte matrix.
 *
 * The decoder is the "inflation" step.  It reads a raw 16-byte buffer and
 * produces a structured object describing the visual, motion, layout, and
 * social properties of a post preview card.
 *
 * This module runs synchronously in the main thread and never touches the DOM.
 */
import { type SocialState } from './bitmask.js';
/** The fully hydrated preview card description. */
export interface PreviewCard {
    visual: {
        vertexColors: [number, number, number, number];
    };
    motion: {
        emotionBase: number;
        animVelocity: number;
        grainTexture: number;
        lightField: number;
    };
    layout: {
        spec: number;
        density: number;
        mediaType: number;
        textLength: number;
    };
    state: {
        hotBucket: number;
        social: SocialState;
    };
    protocolVersion: number;
}
export declare class TasteDecoder {
    /** Return whether a buffer is a supported .taste packet. */
    static supports(raw: Uint8Array): boolean;
    /**
     * Decode a 16-byte buffer into a structured preview card.
     */
    static decode(raw: Uint8Array): PreviewCard;
    private static validate;
}
