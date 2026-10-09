import { readFileSync } from 'fs';

export type ScenarioStatus = 'missing' | 'partial' | 'done';

export type ScenarioMeta = {
  id: string;
  status: ScenarioStatus;
  tier: 'docs' | 'tests' | 'tiny-feature' | 'small-bug' | 'advanced';
  sourceNotification?: string;
  description: string;
};

export type Registry = {
  scenarios: ScenarioMeta[];
};

export function loadRegistry(registryPath: string): Registry {
  const raw = readFileSync(registryPath, 'utf-8');
  return JSON.parse(raw) as Registry;
}

export function findByStatus(registry: Registry, status: ScenarioStatus): ScenarioMeta[] {
  return registry.scenarios.filter((s) => s.status === status);
}
