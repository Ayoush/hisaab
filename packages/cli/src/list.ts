import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

export type ScenarioMeta = {
  id: string;
  status: 'missing' | 'partial' | 'done';
};

type Registry = {
  scenarios: ScenarioMeta[];
};

const __dirname = dirname(fileURLToPath(import.meta.url));

export function listScenarios(status?: string): ScenarioMeta[] {
  const registryPath = join(__dirname, '../../../registry/scenarios.json');
  const registry = JSON.parse(readFileSync(registryPath, 'utf-8')) as Registry;
  if (status) {
    return registry.scenarios.filter((s) => s.status === status);
  }
  return registry.scenarios;
}

export function formatListOutput(scenarios: ScenarioMeta[], statusFilter?: string): string {
  if (scenarios.length === 0) {
    if (statusFilter) {
      return `No scenarios with status '${statusFilter}'.\n`;
    }
    return 'No scenarios found.\n';
  }
  return scenarios.map((s) => `${s.id}\n`).join('');
}
