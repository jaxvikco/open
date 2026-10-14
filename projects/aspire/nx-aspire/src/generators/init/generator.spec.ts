import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readJson } from '@nx/devkit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initGenerator } from './generator.ts';

const pluginVersion = (
  JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8')) as {
    version: string;
  }
).version;

test('uses the resolved plugin version without a workspace node_modules manifest', async () => {
  const tree = createTreeWithEmptyWorkspace();
  expect(tree.exists('node_modules/@jaxvik/nx-aspire/package.json')).toBe(
    false
  );
  await initGenerator(tree, { skipFormat: true });
  const packageJson = readJson(tree, 'package.json');
  expect(packageJson.devDependencies['@jaxvik/nx-aspire']).toBe(pluginVersion);
});

test('adds the aspire CLI to package.json devDependencies', async () => {
  const tree = createTreeWithEmptyWorkspace();
  await initGenerator(tree, { skipFormat: true });
  const packageJson = readJson(tree, 'package.json');
  expect(
    packageJson.devDependencies['@microsoft/aspire-cli']
  ).toBeDefined();
});

test('registers the plugin in nx.json as a bare string', async () => {
  const tree = createTreeWithEmptyWorkspace();
  await initGenerator(tree, { skipFormat: true });
  const nxJson = readJson(tree, 'nx.json');
  expect(nxJson.plugins).toContain('@jaxvik/nx-aspire');
});

test('skips registration if the plugin is already present', async () => {
  const tree = createTreeWithEmptyWorkspace();
  tree.write('nx.json', JSON.stringify({ plugins: ['@jaxvik/nx-aspire'] }));
  await initGenerator(tree, { skipFormat: true });
  const nxJson = readJson(tree, 'nx.json');
  expect(
    nxJson.plugins.filter((p: string) => p === '@jaxvik/nx-aspire')
  ).toHaveLength(1);
});

test('skips registration when the plugin is present as an object entry', async () => {
  const tree = createTreeWithEmptyWorkspace();
  tree.write(
    'nx.json',
    JSON.stringify({ plugins: [{ plugin: '@jaxvik/nx-aspire' }] })
  );
  await initGenerator(tree, { skipFormat: true });
  const nxJson = readJson(tree, 'nx.json');
  expect(nxJson.plugins).toHaveLength(1);
});
