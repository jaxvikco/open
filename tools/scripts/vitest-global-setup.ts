/**
 * This script adapts the local registry scripts to vitest's globalSetup
 * lifecycle: vitest calls the exported setup and teardown functions around
 * the test run.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const here = import.meta.dirname;
const manifestPath = join(
  here,
  '../../projects/aspire/nx-aspire/package.json'
);

let manifestBeforeRelease: string | undefined;

const setup = async () => {
  // The e2e release flow rewrites the lib manifest (version 0.0.0-e2e, lock
  // file, changelog). Snapshot it so teardown can restore the working tree.
  manifestBeforeRelease = readFileSync(manifestPath, 'utf-8');
  const { default: startLocalRegistry } = await import(
    './start-local-registry.ts'
  );
  return startLocalRegistry();
};

const teardown = async () => {
  const { default: stopLocalRegistry } = await import(
    './stop-local-registry.ts'
  );
  await stopLocalRegistry();
  if (manifestBeforeRelease !== undefined) {
    writeFileSync(manifestPath, manifestBeforeRelease);
  }
};

export { setup, teardown };
