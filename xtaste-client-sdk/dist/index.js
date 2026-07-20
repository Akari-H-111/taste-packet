/**
 * @file index.ts
 * @description Project .taste protocol - zero-dependency 16-byte semantic preview encoder/decoder.
 */
// ── Core Protocol ──────────────────────────────────────────────────────
export { TasteMatrix, Field, PACKET_BYTES, PROTOCOL_VERSION, } from './core/matrix.js';
export { TasteEncoder } from './core/encoder.js';
export { TasteDecoder } from './core/decoder.js';
export { InteractionBitmask, Mask } from './core/bitmask.js';
