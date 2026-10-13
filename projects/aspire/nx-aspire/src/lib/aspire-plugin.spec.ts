import { createNodesV2 } from './aspire-plugin';

const context = { workspaceRoot: "/workspace" };


test('detects projects via **/aspire.config.json', async () => {
  const results = await createNodesV2[1](
    ['apps/myhost/aspire.config.json', 'apps/other/aspire.config.json'],
    undefined,
    context
  );
  expect(results).toHaveLength(2);
});

test('sets project root to the aspire.config.json folder and names it after that folder', async () => {
  const [[, result]] = await createNodesV2[1](
    ['apps/myhost/aspire.config.json'],
    undefined,
    context
  );
  const project = result.projects['apps/myhost'];
  expect(project).toBeDefined();
  expect(project.name).toBe('myhost');
  expect(project.root).toBe('apps/myhost');
});

test('infers a continuous, non-cached run target running aspire run in the project root', async () => {
  const [[, result]] = await createNodesV2[1](
    ['apps/myhost/aspire.config.json'],
    undefined,
    context
  );
  const target = result.projects['apps/myhost'].targets['run'];
  expect(target.executor).toBe('nx:run-commands');
  expect(target.options.command).toBe('aspire run');
  expect(target.options.cwd).toBe('{projectRoot}');
  expect(target.continuous).toBe(true);
  expect(target.cache).toBe(false);
});

test('makes the target name configurable via runTargetName', async () => {
  const [[, result]] = await createNodesV2[1](
    ['apps/myhost/aspire.config.json'],
    { runTargetName: 'serve' },
    context
  );
  const project = result.projects['apps/myhost'];
  expect(project.targets['serve']).toBeDefined();
  expect(project.targets['run']).toBeUndefined();
});

test('sets project and target metadata', async () => {
  const [[, result]] = await createNodesV2[1](
    ['apps/myhost/aspire.config.json'],
    undefined,
    context
  );
  const project = result.projects['apps/myhost'];
  expect(project.metadata.technologies).toEqual(['aspire']);
  expect(project.targets['run'].metadata.technologies).toEqual(['aspire']);
  expect(project.targets['run'].metadata.description).toBe(
    'Run the Aspire AppHost'
  );
});

test('adds no dependsOn, configurations, or tags', async () => {
  const [[, result]] = await createNodesV2[1](
    ['apps/myhost/aspire.config.json'],
    undefined,
    context
  );
  const project = result.projects['apps/myhost'];
  const target = project.targets['run'];
  expect(target.dependsOn).toBeUndefined();
  expect(target.configurations).toBeUndefined();
  expect(project.tags).toBeUndefined();
});