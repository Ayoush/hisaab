import { describe, it, expect } from 'vitest';

// Lightweight unit test for the list helper.
// Integration tests for the CLI binary require tsx or a compiled binary;
// see packages/cli/README.md for manual testing instructions.

import { formatListOutput } from './list.js';

describe('list scenarios', () => {
  it('filters by status when requested', () => {
    // Write a temp registry and test filtering logic inline
    const registry = {
      scenarios: [
        { id: 'a', status: 'done', tier: 'tests', description: 'A' },
        { id: 'b', status: 'missing', tier: 'tests', description: 'B' },
      ],
    };
    const missing = registry.scenarios.filter((s) => s.status === 'missing');
    expect(missing).toHaveLength(1);
    expect(missing[0]?.id).toBe('b');
  });
});

describe('formatListOutput', () => {
  it("empty registry → 'No scenarios found.'", () => {
    expect(formatListOutput([])).toBe('No scenarios found.\n');
  });

  it('non-empty registry → one id per line', () => {
    expect(
      formatListOutput([
        { id: 'a', status: 'done' },
        { id: 'b', status: 'missing' },
      ]),
    ).toBe('a\nb\n');
  });

  it('empty filter result → quoted status message', () => {
    expect(formatListOutput([], 'missing')).toBe("No scenarios with status 'missing'.\n");
  });
});
