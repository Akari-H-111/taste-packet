# Project .taste Protocol v1

This document defines the interoperable 16-byte Project .taste preview packet.
The TypeScript implementation lives in `xtaste-client-sdk/src/`.

## Wire format

A packet is exactly 16 unsigned bytes. Multi-byte integer encoding does not
apply because every field occupies one byte.

| Byte | Field | v1 encoding |
|---:|---|---|
| 0 | `VertexColorA` | Bits 0-7 of the post ID hash |
| 1 | `VertexColorB` | Bits 8-15 of the post ID hash |
| 2 | `VertexColorC` | Bits 16-23 of the post ID hash |
| 3 | `VertexColorD` | Bits 24-31 of the post ID hash |
| 4 | `EmotionBase` | `round(emotionScore * 255)` |
| 5 | `AnimVelocity` | Engagement velocity bucket |
| 6 | `GrainTexture` | `0` for video, otherwise `48` |
| 7 | `LightField` | Neutral v1 value `128` |
| 8 | `UILayoutSpec` | Layout ID `0-3` |
| 9 | `ElemDensity` | Media count `0-15` |
| 10 | `MediaType` | Media type `0-4` |
| 11 | `TextLength` | Log-scaled text length |
| 12 | `HotBucket` | Engagement heat bucket |
| 13 | `Interaction` | Social-state bitmask |
| 14 | `Reserved14` | Must be `0` in v1 |
| 15 | `ProtocolVersion` | Must be `1` |

## Input domains

| Input | Valid values |
|---|---|
| `postId` | Non-empty string |
| `text` | String; an empty string is valid |
| `mediaCount` | Integer `0-15` |
| `mediaType` | `0` none, `1` image, `2` video, `3` audio, `4` poll |
| `engagement` | Non-negative safe integer |
| `emotionScore` | Finite number from `0` through `1` |
| `layout` | `0` text-only, `1` top-image, `2` side-image, `3` grid |
| `socialState` | Eight required boolean fields |

Encoders must reject values outside these domains instead of silently wrapping
them into a byte.

All numeric calculations use IEEE 754 binary64 arithmetic. In this document,
`round(x)` means the nearest integer with an exact `.5` tie rounded toward
positive infinity, equivalent to JavaScript `Math.round` for the non-negative
domains used by v1.

## Derived fields

### Post ID hash

Start with unsigned 32-bit value `5381`. For each UTF-16 code unit in `postId`,
calculate `hash = hash * 33 + codeUnit`, retaining the low 32 bits. Bytes 0-3
contain the resulting value from least-significant to most-significant byte.
This is a deterministic palette seed, not a cryptographic hash. Protocol v1
does not define a shared color palette; hosts map the four seed bytes to colors.

### Text length

For a text string containing `n` UTF-16 code units, byte 11 is:

```text
min(255, round(log1p(n) / log1p(1000) * 255))
```

This deliberately matches JavaScript `String.length`. For example, the single
Unicode scalar value `😀` occupies two UTF-16 code units.

### Engagement velocity

| Engagement | Byte 5 |
|---:|---:|
| `< 10` | `16` |
| `< 1,000` | `64` |
| `< 100,000` | `128` |
| `>= 100,000` | `255` |

### Engagement heat

| Engagement | Byte 12 |
|---:|---:|
| `0` | `0` |
| `1-9` | `1` |
| `10-99` | `3` |
| `100-999` | `5` |
| `1,000-9,999` | `7` |
| `10,000-99,999` | `9` |
| `100,000-999,999` | `11` |
| `>= 1,000,000` | `15` |

### Interaction bitmask

| Bit | Mask | Field |
|---:|---:|---|
| 0 | `0x01` | `liked` |
| 1 | `0x02` | `reposted` |
| 2 | `0x04` | `commented` |
| 3 | `0x08` | `bookmarked` |
| 4 | `0x10` | `closeFriend` |
| 5 | `0x20` | `following` |
| 6 | `0x40` | `muted` |
| 7 | `0x80` | `blocked` |

## Version handling

Decoders must verify that the packet is 16 bytes and byte 15 contains a
supported protocol version before interpreting any semantic field. A v1
decoder must also reject layout values above `3`, densities above `15`, media
types above `4`, a nonzero reserved byte, and values outside the derived-field
sets below:

| Field | Valid v1 values |
|---|---|
| `AnimVelocity` | `16`, `64`, `128`, `255` |
| `GrainTexture` | `0` when `MediaType` is video (`2`), otherwise `48` |
| `LightField` | `128` |
| `HotBucket` | `0`, `1`, `3`, `5`, `7`, `9`, `11`, `15` |

An unsupported or invalid packet should fall back to the application's
full-content path.

## Canonical test vector

Input:

```text
postId: post-42
text: The full story can arrive later.
mediaCount: 1
mediaType: 1
engagement: 12000
emotionScore: 0.9
socialState: liked=true, following=true, all other flags=false
layout: 1
```

Expected packet:

```text
de 33 88 bc e6 80 30 80 01 01 01 81 09 21 00 01
```

Continuous hexadecimal form:

```text
de3388bce68030800101018109210001
```

## Cross-language edge vectors

These vectors make the v1 string and rounding semantics explicit:

| Input variation from an otherwise valid post | Expected field |
|---|---|
| `text: "😀"` | `TextLength` (byte 11) is `41` (`0x29`) |
| `emotionScore: 0.5 / 255` | `EmotionBase` (byte 4) is `1` (`0x01`) |
