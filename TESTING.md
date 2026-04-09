# Testing

100% test coverage is the goal. Tests make vibe coding safe — without them, every change is a gamble. With them, you can move fast and trust your instincts.

## Framework

- **Unit/integration:** vitest v2 + @testing-library/react
- **E2E:** Playwright

## Run tests

```bash
npm test              # run unit tests once
npm run test:watch    # watch mode
npm run test:e2e      # Playwright E2E (requires dev server)
```

Tests live in `__tests__/` (unit) and `e2e/` (Playwright).

## Conventions

- File naming: `__tests__/{feature}.test.ts`
- Pure function tests use `environment: "node"` (no jsdom needed)
- Component tests use `// @vitest-environment jsdom` at the top
- Assertions: `expect(x).toBe(y)` — test what the code DOES, not that it exists

## Test expectations

- When writing a new function, write a corresponding test
- When fixing a bug, write a regression test first
- When adding a conditional, test both paths
- Never commit code that makes existing tests fail
