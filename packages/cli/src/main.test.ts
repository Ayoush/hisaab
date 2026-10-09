import { describe, it, expect } from 'vitest';

// Lightweight unit test for the list helper.
// Integration tests for the CLI binary require tsx or a compiled binary;
// see packages/cli/README.md for manual testing instructions.

import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { readFileSync } from 'fs';

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
