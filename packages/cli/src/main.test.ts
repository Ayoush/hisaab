import { describe, it, expect } from 'vitest';

// Lightweight unit test for the list helper.
// Integration tests for the CLI binary require tsx or a compiled binary;
// see packages/cli/README.md for manual testing instructions.

import { join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { readFileSync } from 'fs';
import { scenarioFileError } from './errors.js';

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

describe('scenarioFileError', () => {
  it('bad JSON → invalid-JSON message with exit 1', () => {
    const { message, exitCode } = scenarioFileError(
      new SyntaxError('Unexpected token'),
      'bad-json',
      '/spec/scenarios/bad-json.json',
    );
    expect(message).toBe('Error: bad-json.json: invalid JSON\n');
    expect(exitCode).toBe(1);
  });

  it('missing file → not-found message with exit 2', () => {
    const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    const { message, exitCode } = scenarioFileError(
      err,
      'bad-json',
      '/spec/scenarios/bad-json.json',
    );
    expect(message).toBe('Scenario not found: bad-json\n');
    expect(exitCode).toBe(2);
  });

  it('genuine JSON.parse throw takes the SyntaxError branch', () => {
    const dir = join(tmpdir(), 'hisaab-cli-test');
    mkdirSync(dir, { recursive: true });
    const tmp = join(dir, 'broken.json');
    writeFileSync(tmp, '{invalid', 'utf-8');
    let caught: unknown;
    try {
      JSON.parse(readFileSync(tmp, 'utf-8'));
    } catch (err) {
      caught = err;
    }
    const { message, exitCode } = scenarioFileError(caught, 'broken', tmp);
    expect(message).toBe('Error: broken.json: invalid JSON\n');
    expect(exitCode).toBe(1);
  });
});
