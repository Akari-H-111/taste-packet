# Contributing to .taste

First off, thank you for considering contributing to Project .taste. It's people like you that make the open-source community such a great place to learn, inspire, and create.

## The Minimalist Mandate

This project follows a strict architectural philosophy:
- **Zero Dependencies**: Do not introduce third-party libraries.
- **Fixed Size**: The protocol is 16-bytes. It does not grow.
- **JIT & Synchronous**: No Web Workers, WebAssembly, or async overhead in the SDK core.

## Development Workflow

1. Fork the repo and create your branch from `main`.
2. Run the tests to ensure your baseline is clean:
   ```bash
   npm run build
   npm test
   ```
3. If you've added code that should be tested, update `tests/e2e_integration_test.py`.
4. Ensure the test suite passes.

## Pull Request Process

1. Update the README.md with details of changes to the protocol, if applicable.
2. Keep PRs small and atomic. "He says nothing. He writes one line. It works."
3. Your PR will automatically be tested by our GitHub Actions CI pipeline.
