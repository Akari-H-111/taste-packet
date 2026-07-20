# Project .taste

[![CI Build](https://github.com/Akari-H-111/taste-packet/actions/workflows/ci.yml/badge.svg)](https://github.com/Akari-H-111/taste-packet/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/xtaste-client-sdk.svg)](https://www.npmjs.com/package/xtaste-client-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> *"He says nothing. He writes one line. It works."*
> *Inspired by [Ponytail](https://github.com/DietrichGebert/ponytail).*

Project .taste is a zero-runtime-dependency TypeScript SDK for sending a fixed
16-byte preview of a social post before the full content arrives. It gives a
client enough information to reserve layout, paint a visual palette, and show
interaction state without shipping a large JSON payload first.

**Track:** Developer Tools

## Try it in 60 seconds

Requirements: Node.js 20 or newer.

```bash
git clone https://github.com/Akari-H-111/taste-packet.git
cd taste-packet
npm run setup
npm test
npm run benchmark
```

The checked-in browser demo is available at
[`tests/demo.html`](tests/demo.html), with a hosted copy at
<https://akari-h-111.github.io/taste-packet/tests/demo.html>. To run it locally
with the real SDK module:

```bash
npm run build
python3 -m http.server 4173
```

Then open <http://localhost:4173/tests/demo.html>. The compiled SDK output is
checked in intentionally so the demo can also run from a static GitHub Pages
deployment without rebuilding the repository.

## What the packet contains

Every packet is exactly 16 bytes, arranged as a 4x4 semantic matrix:

```text
               Byte 0          Byte 1          Byte 2          Byte 3
           +---------------+---------------+---------------+---------------+
  Row 0    |  VertexColorA |  VertexColorB |  VertexColorC |  VertexColorD |
           +---------------+---------------+---------------+---------------+
  Row 1    |  EmotionBase  |  AnimVelocity |  GrainTexture |  LightField   |
           +---------------+---------------+---------------+---------------+
  Row 2    |  UILayoutSpec |  ElemDensity  |  MediaType     |  TextLength   |
           +---------------+---------------+---------------+---------------+
  Row 3    |  HotBucket    |  Interaction  |  Reserved14    |  ProtocolVer. |
           +---------------+---------------+---------------+---------------+
```

The packet is a preview contract, not a replacement for content. The
application can fetch localized text, images, and other full-fidelity data in
the background after the client has reserved the correct geometry.

## Usage

Install the zero-runtime-dependency SDK in a Node.js or edge application:

```bash
npm install xtaste-client-sdk
```

Then import it like this:

```typescript
import { TasteEncoder, TasteDecoder } from 'xtaste-client-sdk';

const packet = TasteEncoder.encode({
  postId: '1829384756',
  text: 'Drinking coffee in Tokyo.',
  mediaCount: 1,
  mediaType: 1,
  engagement: 12000,
  emotionScore: 0.9,
  socialState: {
    liked: true,
    reposted: false,
    commented: false,
    bookmarked: false,
    closeFriend: true,
    following: true,
    muted: false,
    blocked: false
  },
  layout: 1
});

const preview = TasteDecoder.decode(packet.buf);
console.log(packet.buf.byteLength); // 16
console.log(preview.state.social.liked); // true
```

`TasteEncoder` is the server or edge projection step. `TasteDecoder` is the
client hydration step. The transport remains responsible for delivery,
retransmission, and ordering; the protocol only defines the compact preview.

For SDK development inside this repository, use `npm run setup` followed by
`npm run build` instead.

## Verification

`npm test` builds the SDK and runs an end-to-end encoder/decoder round trip. It
also checks the fixed packet size, protocol version, social bitmask, and an
invalid-length packet.

`npm run benchmark` uses a deterministic Twitter v2-shaped fixture with 100
posts. It measures the byte size of the fixture against 100 encoded packets:

```text
[Baseline] 100 Twitter v2 JSON payload size: 46.72 KB (47842 Bytes)
[X-Taste] 100 .taste packets total size: 1.56 KB (1600 Bytes)
Bandwidth Savings: 96.66%
```

This is a reproducible local fixture, not a claim about every production
timeline or network. The benchmark also reports the synchronous projection
time on the machine that runs it.

## Supported platforms

- Node.js 20+ for the SDK build, tests, and benchmark.
- Modern browsers for the static demo and browser-side decoder.
- macOS, Linux, and Windows environments with Node.js installed.

## OpenAI Build Week submission

### Project description

Project .taste is a developer tool for progressive social timeline rendering.
It turns rich post metadata into a deterministic 16-byte preview packet, then
turns that packet back into layout, visual, motion, and social state on the
client. The full content remains independently fetchable, so teams can add the
protocol beside an existing REST, GraphQL, gRPC, or edge API.

### How Codex and GPT-5.6 were used

Codex with GPT-5.6 was used to inspect the repository, simplify the protocol
implementation, remove speculative runtime layers, build the TypeScript SDK,
write the encoder/decoder round-trip test, create the deterministic benchmark,
and prepare the CI and browser demo. The key workflow decision was to keep the
protocol synchronous and dependency-free, and to verify the real exported SDK
instead of maintaining a second test-only implementation.

### Judge path

1. Open [`tests/demo.html`](tests/demo.html) for the visual hydration demo.
2. Run `npm run setup && npm test` to verify the SDK round trip.
3. Run `npm run benchmark` to reproduce the size comparison.
4. Read `xtaste-client-sdk/src/` for the protocol implementation and
   `tests/` for the executable checks.

The Devpost submission should include the `/feedback` Codex Session ID for the
session where the core functionality was built. That identifier is intentionally
entered in Devpost rather than committed to this repository.

## FAQ

**Does 16 bytes contain the real text and images?**

No. It contains the information needed to render a stable preview. The full
content can load asynchronously after the layout is reserved.

**Does this require a database migration?**

No. The encoder can run as a sidecar in an API gateway or edge function. It
accepts application data and emits the preview packet without changing storage.

**How does versioning work?**

Byte 14 is reserved and byte 15 contains the protocol version. Clients can
inspect the version before interpreting a packet, while the full content path
remains available as a fallback.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the small development workflow.

## License

MIT. See [`LICENSE`](LICENSE).
