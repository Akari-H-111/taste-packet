import assert from 'node:assert/strict';
import { TasteDecoder, TasteEncoder } from '../xtaste-client-sdk/dist/index.js';

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

assert.equal(matrix.buf.byteLength, 16);
assert.equal(matrix.buf[14], 0x00);
assert.equal(matrix.buf[15], 0x01);

const preview = TasteDecoder.decode(matrix.buf);

assert.deepEqual(preview.state.social, socialState);
assert.equal(preview.state.hotBucket, 0x09);
assert.equal(preview.layout.spec, 1);
assert.equal(preview.layout.density, 1);
assert.equal(preview.layout.mediaType, 1);
assert.equal(preview.protocolVersion, 1);
assert.throws(() => TasteDecoder.decode(new Uint8Array(15)), /Expected 16 bytes/);

console.log('E2E passed: SDK encodes and decodes one 16-byte .taste packet.');
