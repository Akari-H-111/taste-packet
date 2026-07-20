/**
 * encoder.ts — Server-side projection from rich post data to 16 bytes.
 *
 * The encoder is the "dehydration" step.  It takes a high-dimensional post
 * object (text, media, social state, engagement metrics) and crushes it down
 * to 16 bytes using:
 *
 *   • djb2-inspired color hashing for visual palette generation
 *   • Logarithmic bucketing for engagement metrics
 *   • Bitmask packing for social state
 *   • Strict protocol versioning
 *
 * The output is ready to be stored in Redis as a raw binary string, or sent
 * directly over a QUIC DATAGRAM frame.
 */
import { TasteMatrix } from './matrix.js';
import { type SocialState } from './bitmask.js';
/** Input structure representing a social media post. */
export interface RawPostData {
    /** Unique identifier (used as a hash seed for color generation). */
    postId: string;
    /** Post body text. */
    text: string;
    /** Number of media attachments (0–15). */
    mediaCount: number;
    /** Media type: 0 = none, 1 = image, 2 = video, 3 = audio, 4 = poll */
    mediaType: number;
    /** Approximate engagement count (likes + views). */
    engagement: number;
    /** Emotional tone: 0.0 (melancholic) to 1.0 (euphoric). */
    emotionScore: number;
    /** The viewer's relationship to this post. */
    socialState: SocialState;
    /** Layout hint: 0 = text-only, 1 = top-image, 2 = side-image, 3 = grid */
    layout: number;
}
export declare class TasteEncoder {
    /**
     * Project a RawPostData object onto a sealed 16-byte matrix.
     *
     * The returned matrix is ready for storage or transmission.
     */
    static encode(post: RawPostData): TasteMatrix;
    /**
     * A fast, non-cryptographic 32-bit hash for deterministic color generation.
     * Based on the djb2 algorithm.
     */
    static simpleHash(str: string): number;
    /** Map engagement count to an animation velocity byte (0–255). */
    private static velocityFromEngagement;
    /** Logarithmic scaling: compress a range [0, max] into [0, 255]. */
    private static logScale;
    /** Exponential bucketing for engagement (0x00–0x0F). */
    private static engagementBucket;
}
