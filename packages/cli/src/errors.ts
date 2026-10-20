import { basename } from 'path';

export function scenarioFileError(
  err: unknown,
  scenarioId: string,
  scenarioPath: string,
): { message: string; exitCode: number } {
  if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
    return { message: `Scenario not found: ${scenarioId}\n`, exitCode: 2 };
  }
  if (err instanceof SyntaxError) {
    return { message: `Error: ${basename(scenarioPath)}: invalid JSON\n`, exitCode: 1 };
  }
  return { message: `Failed to parse ${scenarioPath}: ${String(err)}\n`, exitCode: 2 };
}
