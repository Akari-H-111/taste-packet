import assert from 'node:assert/strict';
import {
  Field,
  InteractionBitmask,
  Mask,
  PACKET_BYTES,
  PROTOCOL_VERSION,
  TasteDecoder,
  TasteEncoder,
  TasteMatrix,
} from '../xtaste-client-sdk/dist/index.js';

const socialState = {
  liked: true,
  reposted: false,
  commented: true,
  bookmarked: false,
  closeFriend: true,
  following: true,
  muted: false,
  blocked: false,
};

const validPost = (overrides = {}) => ({
  postId: '1829384756',
  text: 'Drinking coffee under the cherry blossoms in Tokyo.',
  mediaCount: 1,
  mediaType: 1,
  engagement: 12000,
  emotionScore: 0.9,
  socialState,
  layout: 1,
  ...overrides,
});

const matrix = TasteEncoder.encode(validPost());

assert.equal(PACKET_BYTES, 16);
assert.equal(PROTOCOL_VERSION, 1);
assert.equal(Field.ProtocolVersion, 15);
assert.equal(Mask.LIKED, 0x01);
assert.equal(matrix.buf.byteLength, PACKET_BYTES);
assert.equal(matrix.buf[14], 0x00);
assert.equal(matrix.buf[15], PROTOCOL_VERSION);
assert.equal(TasteDecoder.supports(matrix.buf), true);

const preview = TasteDecoder.decode(matrix.buf);

assert.deepEqual(preview.state.social, socialState);
assert.equal(preview.state.hotBucket, 0x09);
assert.equal(preview.layout.spec, 1);
assert.equal(preview.layout.density, 1);
assert.equal(preview.layout.mediaType, 1);
assert.equal(preview.protocolVersion, PROTOCOL_VERSION);
assert.equal(InteractionBitmask.toggle(0, Mask.LIKED, true), Mask.LIKED);
assert.equal(new TasteMatrix(matrix.buf).row(3).byteLength, 4);
assert.throws(() => TasteDecoder.decode(new Uint8Array(15)), /Expected 16 bytes/);
assert.equal(TasteDecoder.supports([]), false);
assert.throws(() => TasteDecoder.decode([]), /Expected a Uint8Array/);

const unknownVersion = matrix.buf.slice();
unknownVersion[Field.ProtocolVersion] = 2;
assert.equal(TasteDecoder.supports(unknownVersion), false);
assert.throws(() => TasteDecoder.decode(unknownVersion), /Unsupported protocol version 2/);

const invalidInputs = [
  [{ postId: '' }, /postId must be a non-empty string/],
  [{ text: 42 }, /text must be a string/],
  [{ mediaCount: -1 }, /mediaCount must be an integer between 0 and 15/],
  [{ mediaCount: 16 }, /mediaCount must be an integer between 0 and 15/],
  [{ mediaType: 5 }, /mediaType must be an integer between 0 and 4/],
  [{ engagement: -1 }, /engagement must be an integer/],
  [{ engagement: 0.5 }, /engagement must be an integer/],
  [{ emotionScore: Number.NaN }, /emotionScore must be between 0 and 1/],
  [{ emotionScore: 1.1 }, /emotionScore must be between 0 and 1/],
  [{ layout: 4 }, /layout must be an integer between 0 and 3/],
  [{ socialState: { ...socialState, liked: 1 } }, /socialState.liked must be a boolean/],
];

for (const [overrides, error] of invalidInputs) {
  assert.throws(() => TasteEncoder.encode(validPost(overrides)), error);
}

const canonical = TasteEncoder.encode({
  postId: 'post-42',
  text: 'The full story can arrive later.',
  mediaCount: 1,
  mediaType: 1,
  engagement: 12000,
  emotionScore: 0.9,
  socialState: { ...socialState, commented: false, closeFriend: false },
  layout: 1,
});
assert.equal(
  Buffer.from(canonical.buf).toString('hex'),
  'de3388bce68030800101018109210001'
);

const engagementBoundaries = [
  [0, 16, 0], [9, 16, 1], [10, 64, 3], [99, 64, 3],
  [100, 64, 5], [999, 64, 5], [1000, 128, 7], [9999, 128, 7],
  [10000, 128, 9], [99999, 128, 9], [100000, 255, 11],
  [999999, 255, 11], [1000000, 255, 15],
];

for (const [engagement, velocity, heat] of engagementBoundaries) {
  const bytes = TasteEncoder.encode(validPost({ engagement })).buf;
  assert.equal(bytes[Field.AnimVelocity], velocity);
  assert.equal(bytes[Field.HotBucket], heat);
}

const maximal = TasteEncoder.encode(validPost({
  mediaCount: 15,
  mediaType: 4,
  engagement: Number.MAX_SAFE_INTEGER,
  emotionScore: 1,
  layout: 3,
}));
assert.equal(maximal.buf[Field.EmotionBase], 255);
assert.equal(TasteDecoder.supports(maximal.buf), true);

const unicode = TasteEncoder.encode(validPost({ text: '😀' }));
assert.equal(unicode.buf[Field.TextLength], 41);

const roundingTie = TasteEncoder.encode(validPost({ emotionScore: 0.5 / 255 }));
assert.equal(roundingTie.buf[Field.EmotionBase], 1);

for (let mask = 0; mask <= 255; mask++) {
  assert.equal(InteractionBitmask.encode(InteractionBitmask.decode(mask)), mask);
}

const invalidPackets = [
  [Field.UILayoutSpec, 4, /Invalid UILayoutSpec 4/],
  [Field.ElemDensity, 16, /Invalid ElemDensity 16/],
  [Field.MediaType, 5, /Invalid MediaType 5/],
  [Field.AnimVelocity, 17, /Invalid AnimVelocity 17/],
  [Field.GrainTexture, 0, /Invalid GrainTexture 0/],
  [Field.LightField, 127, /Invalid LightField 127/],
  [Field.HotBucket, 2, /Invalid HotBucket 2/],
  [Field.Reserved14, 1, /Invalid Reserved14 1/],
];

for (const [field, value, error] of invalidPackets) {
  const bytes = canonical.buf.slice();
  bytes[field] = value;
  assert.equal(TasteDecoder.supports(bytes), false);
  assert.throws(() => TasteDecoder.decode(bytes), error);
}

console.log('E2E passed: protocol vectors, boundaries, validation, and all bitmasks.');
