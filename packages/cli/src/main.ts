#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { quote, paise } from '@hisaab/core';
import { listScenarios } from './list.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

if (args[0] === 'list') {
  const statusFilter = args[args.indexOf('--status') + 1];
  const scenarios = listScenarios(statusFilter);
  for (const s of scenarios) {
    process.stdout.write(`${s.id}\n`);
  }
  process.exit(0);
}

if (args[0] === '--scenario') {
  const scenarioId = args[1];
  if (!scenarioId) {
    process.stderr.write('Usage: hisaab --scenario <id>\n');
    process.exit(2);
  }

  const scenarioPath = join(__dirname, '../../../spec/scenarios', `${scenarioId}.json`);
  let scenario: Record<string, unknown>;
  try {
    scenario = JSON.parse(readFileSync(scenarioPath, 'utf-8')) as Record<string, unknown>;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      process.stderr.write(`Scenario not found: ${scenarioId}\n`);
    } else {
      process.stderr.write(`Failed to parse ${scenarioPath}: ${String(err)}\n`);
    }
    process.exit(2);
  }

  const result = quote({
    sellerStateCode: scenario['sellerState'] as string,
    buyerStateCode: scenario['buyerState'] as string,
    hsn: scenario['hsn'] as string,
    ratePercent: scenario['ratePercent'] as number,
    taxableAmountPaise: paise(scenario['taxableAmountPaise'] as number),
  });

  if (!result.ok) {
    process.stderr.write(`Error: ${result.error.message}\n`);
    process.exit(1);
  }

  process.stdout.write(JSON.stringify(result.result, null, 2) + '\n');
  process.exit(0);
}

process.stderr.write('Usage: hisaab --scenario <id> | hisaab list [--status missing]\n');
process.exit(2);
