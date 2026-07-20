# Contributing to Project .taste

Open an issue before changing the protocol contract. Small fixes can go
straight to a pull request.

## Constraints

- The protocol stays exactly 16 bytes.
- The SDK core stays synchronous and has zero runtime dependencies.
- Protocol changes include documentation and a test vector.

## Development Workflow

1. Fork the repository and create a branch from `main`.
2. Install and verify the current baseline:

   ```bash
   npm run setup
   npm test
   ```
3. Add the smallest test that proves the change.
4. Run `npm test` again before opening the pull request.

## Pull Request Process

1. Keep the pull request small and explain the behavior it changes.
2. Update `README.md` or `PROTOCOL.md` when the public contract changes.
3. Let GitHub Actions finish successfully before requesting review.
