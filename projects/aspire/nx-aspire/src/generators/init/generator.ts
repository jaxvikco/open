import {
  addDependenciesToPackageJson,
  formatFiles,
  readJson,
  updateJson,
  type GeneratorCallback,
  type Tree,
} from '@nx/devkit';

export interface InitGeneratorOptions {
  skipFormat?: boolean;
}

export async function initGenerator(
  tree: Tree,
  options: InitGeneratorOptions
): Promise<GeneratorCallback> {
  const packageName = '@jaxvikco/nx-aspire';
  const aspireCliPackage = '@microsoft/aspire-cli';

  // Depend on the version of this plugin that is actually installed in the
  // consumer workspace, so the generator works for any published version.
  const manifestPath = 'node_modules/@jaxvikco/nx-aspire/package.json';
  const pluginVersion = tree.exists(manifestPath)
    ? readJson<{ version: string }>(tree, manifestPath).version
    : 'latest';

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
