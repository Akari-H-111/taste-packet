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
 * The output is ready for storage or transport as raw binary data.
 */
import { TasteMatrix, Field, PROTOCOL_VERSION } from './matrix.js';
import { InteractionBitmask } from './bitmask.js';
const SOCIAL_STATE_KEYS = [
    'liked',
    'reposted',
    'commented',
    'bookmarked',
    'closeFriend',
    'following',
    'muted',
    'blocked',
];
export class TasteEncoder {
    /**
     * Project a RawPostData object onto a 16-byte matrix.
     *
     * The returned matrix is ready for storage or transmission.
     */
    static encode(post) {
        TasteEncoder.assertPost(post);
        const m = new TasteMatrix();
        // ── Row 0: Visual Ambiance ─────────────────────────────────────────
        //
        // We derive four palette seeds from the post ID. The host maps these
        // bytes to its own colors; v1 deliberately does not prescribe a palette.
        // The hash is intentionally simple — we want determinism, not
        // cryptographic strength.
        const hash = TasteEncoder.simpleHash(post.postId);
        m.set(Field.VertexColorA, (hash >>> 0) & 0xff);
        m.set(Field.VertexColorB, (hash >>> 8) & 0xff);
        m.set(Field.VertexColorC, (hash >>> 16) & 0xff);
        m.set(Field.VertexColorD, (hash >>> 24) & 0xff);
        // ── Row 1: Motion Dynamics ─────────────────────────────────────────
        m.set(Field.EmotionBase, Math.round(post.emotionScore * 255));
        m.set(Field.AnimVelocity, TasteEncoder.velocityFromEngagement(post.engagement));
        m.set(Field.GrainTexture, post.mediaType === 2 ? 0x00 : 0x30); // no grain for video
        m.set(Field.LightField, 0x80); // neutral light angle
        // ── Row 2: Layout Skeleton ─────────────────────────────────────────
        m.set(Field.UILayoutSpec, post.layout);
        m.set(Field.ElemDensity, post.mediaCount);
        m.set(Field.MediaType, post.mediaType);
        m.set(Field.TextLength, TasteEncoder.logScale(post.text.length, 1000));
        // ── Row 3: State & Versioning ──────────────────────────────────────
        m.set(Field.HotBucket, TasteEncoder.engagementBucket(post.engagement));
        m.set(Field.Interaction, InteractionBitmask.encode(post.socialState));
        // Versioning: Byte 14 is reserved, Byte 15 is Protocol Version.
        m.set(Field.Reserved14, 0x00);
        m.set(Field.ProtocolVersion, PROTOCOL_VERSION);
        return m;
    }
    // ── Private helpers ──────────────────────────────────────────────────
    static assertPost(post) {
        if (!post || typeof post !== 'object') {
            throw new TypeError('Post data must be an object');
        }
        if (typeof post.postId !== 'string' || post.postId.length === 0) {
            throw new TypeError('postId must be a non-empty string');
        }
        if (typeof post.text !== 'string') {
            throw new TypeError('text must be a string');
        }
        TasteEncoder.assertInteger('mediaCount', post.mediaCount, 0, 15);
        TasteEncoder.assertInteger('mediaType', post.mediaType, 0, 4);
        TasteEncoder.assertInteger('engagement', post.engagement, 0, Number.MAX_SAFE_INTEGER);
        TasteEncoder.assertInteger('layout', post.layout, 0, 3);
        if (!Number.isFinite(post.emotionScore) || post.emotionScore < 0 || post.emotionScore > 1) {
            throw new RangeError('emotionScore must be between 0 and 1');
        }
        if (!post.socialState || typeof post.socialState !== 'object') {
            throw new TypeError('socialState must be an object');
        }
        for (const key of SOCIAL_STATE_KEYS) {
            if (typeof post.socialState[key] !== 'boolean') {
                throw new TypeError(`socialState.${key} must be a boolean`);
            }
        }
    }
    static assertInteger(name, value, min, max) {
        if (!Number.isSafeInteger(value) || value < min || value > max) {
            throw new RangeError(`${name} must be an integer between ${min} and ${max}`);
        }
    }
    /**
     * A fast, non-cryptographic 32-bit hash for deterministic color generation.
     * Based on the djb2 algorithm.
     */
    static simpleHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
        }
        return hash >>> 0;
    }
    /** Map engagement count to an animation velocity byte (0–255). */
    static velocityFromEngagement(n) {
        if (n < 10)
            return 0x10;
        if (n < 1000)
            return 0x40;
        if (n < 100000)
            return 0x80;
        return 0xff;
    }
    /** Logarithmic scaling: compress a range [0, max] into [0, 255]. */
    static logScale(value, max) {
        if (value <= 0)
            return 0;
        const scaled = Math.log1p(value) / Math.log1p(max);
        return Math.min(255, Math.round(scaled * 255));
    }
    /** Exponential bucketing for engagement (0x00–0x0F). */
    static engagementBucket(n) {
        if (n <= 0)
            return 0x00;
        if (n < 10)
            return 0x01;
        if (n < 100)
            return 0x03;
        if (n < 1000)
            return 0x05;
        if (n < 10000)
            return 0x07;
        if (n < 100000)
            return 0x09;
        if (n < 1000000)
            return 0x0b;
        return 0x0f;
    }
}
