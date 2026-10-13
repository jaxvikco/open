import {
  addDependenciesToPackageJson,
  formatFiles,
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

  // Returns a callback that runs the package manager install, linking the
  // aspire CLI into node_modules/.bin so the inferred target's bare
  // `aspire run` command resolves the workspace-local install.
  const installCallback = addDependenciesToPackageJson(
    tree,
    {},
    { [packageName]: '0.0.0-e2e', [aspireCliPackage]: '^13.0.0' }
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
