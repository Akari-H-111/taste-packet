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

const matrix = TasteEncoder.encode({
  postId: '1829384756',
  text: 'Drinking coffee under the cherry blossoms in Tokyo.',
  mediaCount: 1,
  mediaType: 1,
  engagement: 12000,
  emotionScore: 0.9,
  socialState,
  layout: 1,
});

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

const unknownVersion = matrix.buf.slice();
unknownVersion[Field.ProtocolVersion] = 2;
assert.equal(TasteDecoder.supports(unknownVersion), false);
assert.throws(() => TasteDecoder.decode(unknownVersion), /Unsupported protocol version 2/);

assert.throws(
  () => TasteEncoder.encode({
    postId: 'invalid',
    text: '',
    mediaCount: 16,
    mediaType: 1,
    engagement: 0,
    emotionScore: 0.5,
    socialState,
    layout: 0,
  }),
  /mediaCount must be an integer between 0 and 15/
);

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

console.log('E2E passed: SDK encodes and decodes one 16-byte .taste packet.');
