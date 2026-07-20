# Project .taste SDK

The shape arrives first. The story follows.

`xtaste-client-sdk` encodes social-post metadata into one deterministic
16-byte preview packet and decodes it into layout, visual, motion, and social
state. Full text and media stay on the application's existing content path.

## Install

```bash
npm install xtaste-client-sdk
```

## Use

```typescript
import { TasteDecoder, TasteEncoder } from 'xtaste-client-sdk';

const packet = TasteEncoder.encode({
  postId: 'post-42',
  text: 'The full story can arrive later.',
  mediaCount: 1,
  mediaType: 1,
  engagement: 12000,
  emotionScore: 0.9,
  socialState: {
    liked: true,
    reposted: false,
    commented: false,
    bookmarked: false,
    closeFriend: false,
    following: true,
    muted: false,
    blocked: false,
  },
  layout: 1,
});

const preview = TasteDecoder.decode(packet.buf);
console.log(packet.buf.byteLength); // 16
console.log(preview.layout.mediaType); // 1
```

The package has zero runtime dependencies and supports Node.js 20+ and modern
browsers. See the [repository](https://github.com/Akari-H-111/taste-packet),
[live demo](https://akari-h-111.github.io/taste-packet/tests/demo.html), and
[protocol specification](https://github.com/Akari-H-111/taste-packet/blob/main/PROTOCOL.md)
for verification details.

## License

MIT
