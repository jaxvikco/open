import type { CreateNodesContext } from '@nx/devkit';
import { createNodesV2 } from './aspire-plugin';

const context = {
  workspaceRoot: '/workspace',
  nxJsonConfiguration: {},
} satisfies CreateNodesContext;

async function runPlugin(
  configFilePaths: readonly string[],
  options?: { runTargetName?: string }
) {
  const results = await createNodesV2[1](configFilePaths, options, context);
  return results.map(([, result]) => result.projects ?? {});
}

test('detects projects via **/aspire.config.json', async () => {
  const results = await createNodesV2[1](
    ['apps/myhost/aspire.config.json', 'apps/other/aspire.config.json'],
    undefined,
    context
  );
  expect(results).toHaveLength(2);
});

test('sets project root to the aspire.config.json folder and names it after that folder', async () => {
  const [projects] = await runPlugin(['apps/myhost/aspire.config.json']);
  expect(projects['apps/myhost']).toMatchObject({
    root: 'apps/myhost',
    name: 'myhost',
  });
});

test('infers a continuous, non-cached run target running aspire run in the project root', async () => {
  const [projects] = await runPlugin(['apps/myhost/aspire.config.json']);
  expect(projects['apps/myhost'].targets?.run).toMatchObject({
    executor: 'nx:run-commands',
    options: {
      command: 'aspire run',
      cwd: '{projectRoot}',
    },
    continuous: true,
    cache: false,
  });
});

test('makes the target name configurable via runTargetName', async () => {
  const [projects] = await runPlugin(['apps/myhost/aspire.config.json'], {
    runTargetName: 'serve',
  });
  expect(projects['apps/myhost'].targets?.serve).toBeDefined();
  expect(projects['apps/myhost'].targets?.run).toBeUndefined();
});

test('sets project and target metadata', async () => {
  const [projects] = await runPlugin(['apps/myhost/aspire.config.json']);
  expect(projects['apps/myhost'].metadata).toEqual({
    technologies: ['aspire'],
  });
  expect(projects['apps/myhost'].targets?.run?.metadata).toEqual({
    technologies: ['aspire'],
    description: 'Run the Aspire AppHost',
  });
});

test('adds no dependsOn, configurations, or tags', async () => {
  const [projects] = await runPlugin(['apps/myhost/aspire.config.json']);
  const project = projects['apps/myhost'];
  expect(project.targets?.run?.dependsOn).toBeUndefined();
  expect(project.targets?.run?.configurations).toBeUndefined();
  expect(project.tags).toBeUndefined();
});
