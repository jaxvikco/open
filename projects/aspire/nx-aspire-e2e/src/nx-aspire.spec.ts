import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs';

let projectDirectory: string;

beforeAll(async () => {
  projectDirectory = createTestProject();

  execSync(`npm install -D @jaxvikco/nx-aspire@e2e`, {
    cwd: projectDirectory,
    stdio: 'inherit',
    env: process.env,
  });
}, 300_000);

afterAll(() => {
  if (projectDirectory) {
    rmSync(projectDirectory, {
      recursive: true,
      force: true,
    });
  }
});

test('should be installed', () => {
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
      cwd: 'apps/myhost',
    },
    continuous: true,
    cache: false,
  });
  expect(project.metadata.technologies).toEqual(['aspire']);
});

function createTestProject() {
  const projectName = 'test-project';
  const projectDirectory = join(process.cwd(), 'tmp', projectName);

  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(dirname(projectDirectory), {
    recursive: true,
  });

  execSync(
    `npm exec --no-workspaces --yes create-nx-workspace@latest -- ${projectName} --preset apps --nxCloud=skip --no-interactive --skipGit`,
    {
      cwd: dirname(projectDirectory),
      stdio: 'inherit',
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
