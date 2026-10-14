import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readJson } from '@nx/devkit';
import { initGenerator } from './generator';

test('adds the plugin to package.json devDependencies', async () => {
  const tree = createTreeWithEmptyWorkspace();
  await initGenerator(tree, { skipFormat: true });
  const packageJson = readJson(tree, 'package.json');
  expect(packageJson.devDependencies['@jaxvikco/nx-aspire']).toBeDefined();
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
  expect(nxJson.plugins).toContain('@jaxvikco/nx-aspire');
});

test('skips registration if the plugin is already present', async () => {
  const tree = createTreeWithEmptyWorkspace();
  tree.write('nx.json', JSON.stringify({ plugins: ['@jaxvikco/nx-aspire'] }));
  await initGenerator(tree, { skipFormat: true });
  const nxJson = readJson(tree, 'nx.json');
  expect(
    nxJson.plugins.filter((p: string) => p === '@jaxvikco/nx-aspire')
  ).toHaveLength(1);
});

test('skips registration when the plugin is present as an object entry', async () => {
  const tree = createTreeWithEmptyWorkspace();
  tree.write(
    'nx.json',
    JSON.stringify({ plugins: [{ plugin: '@jaxvikco/nx-aspire' }] })
  );
  await initGenerator(tree, { skipFormat: true });
  const nxJson = readJson(tree, 'nx.json');
  expect(nxJson.plugins).toHaveLength(1);
});
