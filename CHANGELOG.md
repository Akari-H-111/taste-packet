# Changelog

## 1.1.1 - 2026-07-21

### Added

- Cross-language conformance vectors for UTF-16 text length and rounding ties.
- Boundary coverage for engagement buckets, all interaction masks, and invalid packets.
- CI verification of the packed npm artifact through its public export map.

### Changed

- Protocol v1 now states its exact numeric, string-length, palette, and decoder-validation semantics.
- The browser demo decodes checked-in packets and fetches full content through a separate resource.

### Fixed

- Malformed v1 packets are rejected consistently by `supports()` and `decode()`.
- Package creation now rebuilds `dist` through `prepack` instead of trusting stale artifacts.

## 1.1.0 - 2026-07-21

### Added

- A complete byte-level protocol specification with a canonical test vector.
- Runtime exports for `Field`, `Mask`, `PACKET_BYTES`, and `PROTOCOL_VERSION`.
- Strict encoder input validation and decoder version support checks.
- Package-level README and license files for npm.
- A responsive live demo with packet inspection and observed CLS reporting.

### Changed

- Package metadata now exposes a standard ESM export map and declares Node.js 20 or newer.
- CI now verifies the package on Node.js 20.
- Project documentation now leads with an installable path, measured benchmark, and protocol contract.

### Fixed

- Public enum exports are now available at runtime instead of disappearing during TypeScript compilation.
- Published package contents now include the documentation and license expected on npm.
