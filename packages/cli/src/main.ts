#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { quote, paise } from '@hisaab/core';
import { listScenarios, formatListOutput } from './list.js';
import { toJsonPayload, toHumanLines } from './format.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

if (args[0] === 'list') {
  const statusIdx = args.indexOf('--status');
  const statusFilter = statusIdx !== -1 ? args[statusIdx + 1] : undefined;
  const scenarios = listScenarios(statusFilter);
  process.stdout.write(formatListOutput(scenarios, statusFilter));
  process.exit(0);
}

if (args.includes('--scenario')) {
  const scenarioIdx = args.indexOf('--scenario');
  const scenarioId = args[scenarioIdx + 1];
  if (!scenarioId || scenarioId.startsWith('-')) {
    process.stderr.write('Usage: hisaab --scenario <id> [--json]\n');
    process.exit(2);
  }
  const jsonMode = args.includes('--json');

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

  if (jsonMode) {
    process.stdout.write(JSON.stringify(toJsonPayload(result.result), null, 2) + '\n');
  } else {
    process.stdout.write(toHumanLines(scenarioId, result.result) + '\n');
  }
  process.exit(0);
}

process.stderr.write('Usage: hisaab --scenario <id> [--json] | hisaab list [--status missing]\n');
process.exit(2);
