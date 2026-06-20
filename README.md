# Project .taste (v1.0.0)

[![CI Build](https://github.com/Akari-H-111/taste-packet/actions/workflows/ci.yml/badge.svg)](https://github.com/Akari-H-111/taste-packet/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> *"He says nothing. He writes one line. It works."*

---

## 🐎 A Minimalist's Greeting

Greetings, fellow travelers.

If you have stumbled upon this quiet corner of the digital world, you are most welcome. 

We observe with a quiet heart how modern systems handle data. When a hundred thousand souls simultaneously ask to see what is happening in the world, modern servers reply by throwing massive bundles of heavy JSON text across the airwaves. The network stumbles, packets are lost, and devices stutter.

`Project .taste` is our humble attempt to offer a remedy. It is not a loud, flashy invention. It is merely a return to a gentler engineering tradition: **the Unix philosophy of doing one small thing, and doing it with absolute devotion.**

We have compressed the chaotic, high-dimensional reality of a social timeline down into a tight, immovable **16-byte (128-bit) 4x4 Semantic Matrix**. We store it cold, we carry it lightly, and we let the client expand it gracefully. Zero WebAssembly. Zero Web Workers. Zero dependencies. Just pure, JIT-optimized bitwise operations.

<p align="center">
  <img src="assets/demo.gif" width="600" alt="16-byte X-Taste visual hydration demo">
  <br>
  <em>10 posts hydrating instantly from 160 bytes. Zero layout shifts. Rendered via native GPU CSS gradients.</em>
</p>

---

## 📐 1. Architectural Architecture: The 4x4 Matrix Topology

A `.taste` packet refuses to grow or shrink; it is always exactly 16 bytes.

```text
               Column 0        Column 1        Column 2        Column 3
           +---------------+---------------+---------------+---------------+
  Row 0    |  VertexColorA |  VertexColorB |  VertexColorC |  VertexColorD |  -> Visual Ambiance
           +---------------+---------------+---------------+---------------+
  Row 1    |  EmotionBase  |  AnimVelocity |  GrainTexture |  LightField   |  -> Motion Dynamics
           +---------------+---------------+---------------+---------------+
  Row 2    |  UILayoutSpec |  ElemDensity  |  MediaType    |  TextLength   |  -> Layout Skeleton
           +---------------+---------------+---------------+---------------+
  Row 3    |  HotBucket    |  Interaction  |  Reserved14   |ProtocolVersion|  -> State & Versioning
           +---------------+---------------+---------------+---------------+
```

### 1.1 Pure Separation of Duties
*   **Row 0 (Visual Ambiance)**: Four numbers representing color palette indices.
*   **Row 1 (Motion Dynamics)**: Controls how the background flows and breathes.
*   **Row 2 (Layout Skeleton)**: Predefines the geometry of the text and media slots.
*   **Row 3 (State & Versioning)**: Holds the social interaction switches (Likes, Reposts), a reserved byte (`Reserved14`) for future expansion, and a strict `ProtocolVersion` (`Byte 15`) header.

---

## 🛡️ 2. Minimalist Transport Philosophy

In `.taste`, we reject the over-engineering of application-layer Forward Error Correction (FEC). Rather than manually writing cross-XOR bitwise recovery algorithms to fight packet loss, we adhere to a strictly layered architecture:

We deliver the 16 bytes via HTTP/3 (QUIC) response headers or WebSockets, delegating all error-recovery, checksumming, and retransmission to the transport layer. If a packet drops, QUIC handles it. If the protocol needs to evolve, the **ProtocolVersion** (Byte 15) handles it.

This zero-redundancy design keeps the SDK unbelievably fast, synchronously hydrating the user interface in ~1 millisecond.

---

## 📦 3. Installation & Usage

Install the core SDK via npm:
```bash
npm install xtaste-client-sdk
```

### Encoding (Server-side/Edge)
```typescript
import { TasteEncoder } from 'xtaste-client-sdk';

const matrix = TasteEncoder.encode({
  postId: "1829384756",
  text: "Drinking coffee in Tokyo 🌸☕",
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

// Emit these 16 bytes over QUIC Datagrams or HTTP Headers
const payload = matrix.buf; 
```

### Decoding (Client-side UI)
```typescript
import { TasteDecoder } from 'xtaste-client-sdk';

// Rehydrate instantly upon receiving the 16 bytes
const preview = TasteDecoder.decode(payload);

console.log(preview.state.social.liked); // true
console.log(preview.layout.textLength);  // Extrapolated line count
```

---

## 🛠️ 4. Local Development & Benchmarks

We provide a pure TypeScript SDK and a small Node.js audit. No runtime dependencies required.

### Run the SDK E2E Audit
```bash
npm test
```
*Builds the SDK, then proves the encoder and decoder round-trip one real 16-byte packet.*

**Audit Output Snapshot:**
```text
E2E passed: SDK encodes and decodes one 16-byte .taste packet.
```

### Run the Performance Benchmark (Node.js)
```bash
npm run benchmark
```
*Simulates projecting a heavy Twitter API v2 payload into the 16-byte .taste matrix, proving the 96%+ bandwidth savings and sub-millisecond execution time.*

**Benchmark Snapshot:**
```text
[Baseline] 100 Twitter v2 JSON payload size: 46.72 KB (47842 Bytes)
[X-Taste] 100 .taste packets total size: 1.56 KB (1600 Bytes)
Bandwidth Savings: 96.66%
```

---

## 🏢 5. FAQ: The Enterprise Architect's Dilemma

When we share this with young architects, they often present three valid concerns. We answer them here:

**Q: If you only send 16 bytes for the skeleton, how do users see the real text and images?**
A: `.taste` is not a replacement for content; it is a **decoupling of preview and content**. By delivering the 16-byte matrix instantly, the client locks the layout geometry, paints the ambient color (derived from the actual image), and sets the interaction state in 0.1 seconds. The heavy JSON containing localized text and 4K images is then lazy-loaded asynchronously in the background. The user perceives an instant load, and layout shift (CLS) is entirely eliminated.

**Q: Our backend uses GraphQL/gRPC. Doesn't this require massive database migrations?**
A: Not at all. `.taste` is an **unintrusive side-car**. You do not change your database schemas. You simply place our 0-dependency `TasteEncoder` in your API Gateway or Edge Worker (e.g., Cloudflare Workers). It intercepts the heavy outgoing payload, crushes it into the 16-byte matrix on the fly, and fires it down to the client.

**Q: How does this scale as our application grows and adds new features?**
A: We have explicitly reserved Byte 14 for imminent layout flags and allocated Byte 15 as the `ProtocolVersion`. This ensures that even if we bump to a 32-byte or dynamically-sized protocol in the future, older legacy clients will gracefully fall back or drop the packet upon seeing an unsupported version.

---

## 🤝 6. An Invitation to Collaborate

We do not seek fame or fortune for this project; we only wish to leave the internet a slightly lighter, more peaceful place than we found it.

Please feel free to open an Issue or submit a Pull Request. 

*“Let us dry the heavy waters of the web, and let the small devices blossom on the edge.”*
