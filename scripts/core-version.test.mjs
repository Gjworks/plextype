import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { writeCoreVersion } from './write-core-version.mjs';
import { isPlextypeSource, releaseArgs, sourceMarker } from './release.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

const read = file => JSON.parse(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));

// 배포판을 받은 프로젝트는 package.json의 version을 자기 앱 버전으로 올린다.
// 원본이 이 줄을 바꾸면 그 프로젝트가 코어를 병합할 때마다 충돌하므로 원본에서는 0.1.0으로 고정한다.
test('source repository keeps package.json version at the distribution default', { skip: !isPlextypeSource(root) }, () => {
  const pkg = read('package.json');
  assert.equal(pkg.version, '0.1.0');
  assert.ok(!Object.values(pkg.scripts).some(script => /npm version/.test(script)));
});

test('core release bumps only src/core/plextype.json; project release bumps package.json', () => {
  const core = read('.release-it.plextype.json');
  assert.equal(core.npm, false);
  assert.ok(core.hooks['after:bump'].includes('node scripts/write-core-version.mjs ${version}'));
  assert.equal(core.plugins['@release-it/conventional-changelog'].infile, 'CHANGELOG.md');
  const project = read('.release-it.json');
  assert.notEqual(project.npm, false);
  assert.equal(project.hooks, undefined);
  assert.equal(project.plugins['@release-it/conventional-changelog'].infile, 'CHANGELOG.project.md');
  assert.equal(read('package.json').scripts.release, 'node scripts/release.mjs');
});

test('npm run release picks the core config only where the sync workflow exists', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plextype-release-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  assert.deepEqual(releaseArgs(dir, ['--ci']), ['--ci']);
  fs.mkdirSync(path.join(dir, '.github/workflows'), { recursive: true });
  fs.writeFileSync(path.join(dir, sourceMarker), '');
  assert.deepEqual(releaseArgs(dir, ['--ci']), ['--config', '.release-it.plextype.json', '--ci']);
});

test('the release hook writes the core version file and rejects invalid versions', t => {
  assert.match(read('src/core/plextype.json').version, /^\d+\.\d+\.\d+/);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plextype-version-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'src/core'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src/core/plextype.json'), '{"version":"1.0.0"}');
  writeCoreVersion(dir, '1.2.3');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'src/core/plextype.json'), 'utf8')), { version: '1.2.3' });
  assert.throws(() => writeCoreVersion(dir, 'next'), /Invalid version/);
  assert.throws(() => writeCoreVersion(dir, undefined), /Invalid version/);
});

// 프로젝트 전용 패키지는 src/extensions/package.json에 두어 배포판과 코어 package.json에서 분리한다.
test('project-only packages are declared in the extensions workspace, not the core manifest', () => {
  const pkg = read('package.json');
  assert.deepEqual(pkg.workspaces, ['src/extensions']);
  const file = new URL('../src/extensions/package.json', import.meta.url);
  if (!fs.existsSync(file)) return;
  const extension = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const name of Object.keys({ ...extension.dependencies, ...extension.devDependencies })) {
    assert.equal(pkg.dependencies?.[name], undefined, `${name} is declared in both manifests`);
    assert.equal(pkg.devDependencies?.[name], undefined, `${name} is declared in both manifests`);
  }
});
