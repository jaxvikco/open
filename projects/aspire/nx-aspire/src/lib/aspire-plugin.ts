import type { CreateNodesV2 } from '@nx/devkit';

export interface AspirePluginOptions {
  runTargetName?: string;
}

export const aspireConfigGlob = '**/aspire.config.json';

export const createNodesV2: CreateNodesV2<AspirePluginOptions> = [
  aspireConfigGlob,
  async (configFilePaths, options) => {
    const runTargetName = options?.runTargetName ?? 'run';
    return configFilePaths.map((configFilePath) => [
      configFilePath,
      createProject(configFilePath, runTargetName),
    ]);
  },
];

function createProject(configFilePath: string, runTargetName: string) {
  const projectRoot = configFilePath.replace(/\/aspire\.config\.json$/, '');
  const segments = projectRoot.split('/');
  const projectName = segments[segments.length - 1];

  return {
    projects: {
      [projectRoot]: {
        root: projectRoot,
        name: projectName,
        metadata: {
          technologies: ['aspire'],
        },
        targets: {
          [runTargetName]: {
            executor: 'nx:run-commands',
            options: {
              command: 'aspire run',
              cwd: '{projectRoot}',
            },
            continuous: true,
            cache: false,
            metadata: {
              technologies: ['aspire'],
              description: 'Run the Aspire AppHost',
            },
          },
        },
      },
    },
  };
}
