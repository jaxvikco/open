import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { mkdirSync, rmSync } from 'fs';

describe('@jaxvikco/nx-aspire', () => {
  let projectDirectory: string;

  // This hook shells out synchronously twice, so its budget has to cover both
  // installs on a cold package manager cache. Otherwise work that succeeded
  // still fails on return.
  beforeAll(() => {
    projectDirectory = createTestProject();

    // The plugin has been built and published to a local registry in the globalSetup
    // Install the plugin built with the latest source code into the test repo
    execSync(`npm install -D @jaxvikco/nx-aspire@e2e`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  }, 300_000);

  afterAll(() => {
    if (projectDirectory) {
      // Cleanup the test project
      rmSync(projectDirectory, {
        recursive: true,
        force: true,
      });
    }
  });


  it('should be installed', () => {
    // npm ls will fail if the package is not installed properly
    execSync('npm ls @jaxvikco/nx-aspire', {
      cwd: projectDirectory,
      stdio: 'inherit',
    });
  });
});

/**
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function createTestProject() {
  const projectName = 'test-project';
  const projectDirectory = join(process.cwd(), 'tmp', projectName);

  // Ensure projectDirectory is empty
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(dirname(projectDirectory), {
    recursive: true,
  });

  // --no-workspaces: npm 11 fails with ENOWORKSPACES when npx runs inside a
  // package.json workspaces root. --skipGit: the tmp dir is gitignored, so
  // create-nx-workspace's `git add` would fail the scaffold.
  // The root package.json excludes `!**/tmp/**` from workspaces so npm's
  // workspace-root detection does not adopt the monorepo root for the
  // scaffolded project (which intermittently crashes arborist: "Cannot
  // read properties of null (reading 'package')").
  execSync(
    `npm exec --no-workspaces --yes create-nx-workspace@latest -- ${projectName} --preset apps --nxCloud=skip --no-interactive --skipGit`,
    {
      cwd: dirname(projectDirectory),
      stdio: 'inherit',
      // npm's audit request hits the local verdaccio registry, which 404s
      // the bulk advisory endpoint and crashes npm's arborist.
      env: {
        ...process.env,
        npm_config_audit: 'false',
        npm_config_fund: 'false',
      },
    }
  );
  console.log(`Created test project in "${projectDirectory}"`);

  return projectDirectory;
}
