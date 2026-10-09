import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

type ScenarioMeta = {
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
