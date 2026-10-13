import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs';

let projectDirectory: string;

// This hook shells out synchronously twice, so its budget has to cover both
// installs on a cold package manager cache. Otherwise work that succeeded
// still fails on return.
beforeAll(async () => {
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

test('should be installed', () => {
  // npm ls will fail if the package is not installed properly
  execSync('npm ls @jaxvikco/nx-aspire', {
    cwd: projectDirectory,
    stdio: 'inherit',
  });
});

test('init generator registers the plugin in nx.json', () => {
  execSync('npx nx g @jaxvikco/nx-aspire:init --no-interactive', {
    cwd: projectDirectory,
    stdio: 'inherit',
    env: process.env,
  });
  const nxJson = JSON.parse(
    readFileSync(join(projectDirectory, 'nx.json'), 'utf-8')
  );
  expect(nxJson.plugins).toContain('@jaxvikco/nx-aspire');
  // The daemon may have cached the graph from before the plugin was
  // registered, so reset it before asserting on inferred projects.
  execSync('npx nx reset', {
    cwd: projectDirectory,
    stdio: 'ignore',
    env: process.env,
  });
});

test('init generator installs the aspire CLI locally', () => {
  const packageJson = JSON.parse(
    readFileSync(join(projectDirectory, 'package.json'), 'utf-8')
  );
  expect(
    packageJson.devDependencies['@microsoft/aspire-cli']
  ).toBeDefined();
  // The CLI must be linked into node_modules/.bin so the bare `aspire run`
  // command in the inferred target resolves the workspace-local install.
  expect(
    existsSync(join(projectDirectory, 'node_modules', '.bin', 'aspire'))
  ).toBe(true);
});

test('infers a run target for projects with aspire.config.json', () => {
  const appHostDir = join(projectDirectory, 'apps', 'myhost');
  mkdirSync(appHostDir, { recursive: true });
  writeFileSync(join(appHostDir, 'aspire.config.json'), '{}');

  const output = execSync('npx nx show project myhost --json', {
    cwd: projectDirectory,
    stdio: 'pipe',
    env: process.env,
  }).toString();

  const project = JSON.parse(output);
  expect(project.name).toBe('myhost');
  expect(project.targets.run).toMatchObject({
    executor: 'nx:run-commands',
    options: {
      command: 'aspire run',
      // {projectRoot} is resolved to the real path in show project output
      cwd: 'apps/myhost',
    },
    continuous: true,
    cache: false,
  });
  expect(project.metadata.technologies).toEqual(['aspire']);
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
