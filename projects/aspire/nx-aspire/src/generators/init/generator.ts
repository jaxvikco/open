import {
  addDependenciesToPackageJson,
  formatFiles,
  updateJson,
  type GeneratorCallback,
  type Tree,
} from '@nx/devkit';
import { readFileSync } from 'node:fs';

export interface InitGeneratorOptions {
  skipFormat?: boolean;
}

export async function initGenerator(
  tree: Tree,
  options: InitGeneratorOptions
): Promise<GeneratorCallback> {
  const packageName = '@jaxvik/nx-aspire';
  const aspireCliPackage = '@microsoft/aspire-cli';

  const pluginPackageJson: { version: string } = JSON.parse(
    readFileSync(
      new URL(import.meta.resolve(`${packageName}/package.json`)),
      'utf-8'
    )
  );
  const pluginVersion = pluginPackageJson.version;

  const installCallback = addDependenciesToPackageJson(
    tree,
    {},
    { [packageName]: pluginVersion, [aspireCliPackage]: '^13.6.0' }
  );

  updateJson(tree, 'nx.json', (nxJson) => {
    const plugins: unknown[] = nxJson.plugins ?? [];
    const alreadyRegistered = plugins.some(
      (plugin) =>
        plugin === packageName ||
        (typeof plugin === 'object' &&
          plugin !== null &&
          (plugin as { plugin?: string }).plugin === packageName)
    );
    if (!alreadyRegistered) {
      nxJson.plugins = [...plugins, packageName];
    }
    return nxJson;
  });

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return installCallback;
}

export default initGenerator;
