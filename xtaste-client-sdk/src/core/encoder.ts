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

import { TasteMatrix, Field } from './matrix.js';
import { InteractionBitmask, type SocialState } from './bitmask.js';

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

export class TasteEncoder {
  /**
   * Project a RawPostData object onto a sealed 16-byte matrix.
   *
   * The returned matrix is ready for storage or transmission.
   */
  static encode(post: RawPostData): TasteMatrix {
    const m = new TasteMatrix();

    // ── Row 0: Visual Ambiance ─────────────────────────────────────────
    //
    // We derive four "vertex colors" from the post ID.  These are palette
    // indices that the client maps to actual RGB values using a shared
    // 256-color palette.  The hash is intentionally simple — we want
    // determinism, not cryptographic strength.
    const hash = TasteEncoder.simpleHash(post.postId);
    m.set(Field.VertexColorA, (hash >>> 0)  & 0xff);
    m.set(Field.VertexColorB, (hash >>> 8)  & 0xff);
    m.set(Field.VertexColorC, (hash >>> 16) & 0xff);
    m.set(Field.VertexColorD, (hash >>> 24) & 0xff);

    // ── Row 1: Motion Dynamics ─────────────────────────────────────────
    m.set(Field.EmotionBase,  Math.round(post.emotionScore * 255));
    m.set(Field.AnimVelocity, TasteEncoder.velocityFromEngagement(post.engagement));
    m.set(Field.GrainTexture, post.mediaType === 2 ? 0x00 : 0x30); // no grain for video
    m.set(Field.LightField,   0x80); // neutral light angle

    // ── Row 2: Layout Skeleton ─────────────────────────────────────────
    m.set(Field.UILayoutSpec, post.layout & 0x0f);
    m.set(Field.ElemDensity,  Math.min(post.mediaCount, 15));
    m.set(Field.MediaType,    post.mediaType & 0x0f);
    m.set(Field.TextLength,   TasteEncoder.logScale(post.text.length, 1000));

    // ── Row 3: State & Versioning ──────────────────────────────────────
    m.set(Field.HotBucket,   TasteEncoder.engagementBucket(post.engagement));
    m.set(Field.Interaction, InteractionBitmask.encode(post.socialState));

    // Versioning: Byte 14 is reserved, Byte 15 is Protocol Version.
    m.set(Field.Reserved14, 0x00);
    m.set(Field.ProtocolVersion, 0x01);

    return m;
  }

  // ── Private helpers ──────────────────────────────────────────────────

  /**
   * A fast, non-cryptographic 32-bit hash for deterministic color generation.
   * Based on the djb2 algorithm.
   */
  static simpleHash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
  }

  /** Map engagement count to an animation velocity byte (0–255). */
  private static velocityFromEngagement(n: number): number {
    if (n < 10)     return 0x10;
    if (n < 1000)   return 0x40;
    if (n < 100000) return 0x80;
    return 0xff;
  }

  /** Logarithmic scaling: compress a range [0, max] into [0, 255]. */
  private static logScale(value: number, max: number): number {
    if (value <= 0) return 0;
    const scaled = Math.log1p(value) / Math.log1p(max);
    return Math.min(255, Math.round(scaled * 255));
  }

  /** Exponential bucketing for engagement (0x00–0x0F). */
  private static engagementBucket(n: number): number {
    if (n <= 0)       return 0x00;
    if (n < 10)       return 0x01;
    if (n < 100)      return 0x03;
    if (n < 1000)     return 0x05;
    if (n < 10000)    return 0x07;
    if (n < 100000)   return 0x09;
    if (n < 1000000)  return 0x0b;
    return 0x0f;
  }
}
