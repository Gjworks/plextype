// 쉬운 설치의 코어 업데이트를, 서명까지 실제로 하는 가짜 Store 서버와 임시 프로젝트 폴더로 확인한다.
// 배포본 ZIP은 릴리스 워크플로가 쓰는 scripts/publish-core.mjs로 만든다.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildCoreZip, listCoreFiles, publishCore, readCommitted } from './publish-core.mjs';

const lib = await import('../src/modules/installer/lib/storeInstall.ts');
const core = await import('../src/modules/installer/lib/coreUpdate.ts');
const TOKEN = `pxt_${'a'.repeat(16)}_${'b'.repeat(48)}`;
const PUBLISH_TOKEN = 'publish-'.repeat(5);
const digest = value => createHash('sha256').update(value).digest('hex');
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const publicPem = publicKey.export({ format: 'pem', type: 'spki' }).toString();

async function writeFiles(root, sources) {
  for (const [file, text] of Object.entries(sources)) {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), text);
  }
}

const packageJson = (name, version, dependencies) => `${JSON.stringify({ name, version, dependencies }, null, 2)}\n`;
const coreFiles = (version, dependencies, sources) => ({
  'src/core/plextype.json': `${JSON.stringify({ version })}\n`,
  'package.json': packageJson('plextype', '0.1.0', dependencies),
  ...sources,
});

// Store가 등록받을 때 하는 일과 같다: 파일 목록으로 manifest를 만들고 manifest·ZIP 해시·크기에 서명한다.
function signRelease(zip) {
  const metadata = { manifest: core.buildCoreManifest(lib.readZipEntries(zip)), sha256: digest(zip), size: zip.length };
  return { zip, metadata: { ...metadata, signature: {
    algorithm: 'Ed25519', keyId: 'test-key', publicKey: 'ignored-by-installer',
    value: sign(null, Buffer.from(lib.canonical(metadata)), privateKey).toString('base64'),
  } } };
}

async function buildRelease(t, sources) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'core-release-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await writeFiles(directory, sources);
  return signRelease(buildCoreZip(Object.keys(sources).sort(), file => readFileSync(path.join(directory, file))));
}

const BASE = coreFiles('0.11.2', { next: '16.0.0' }, {
  'src/core/a.ts': 'a1',
  'src/core/b.ts': 'b1',
  'src/core/c.ts': 'c1',
  'src/core/old/d.ts': 'd1',
  'src/core/e.ts': 'e1',
  'src/core/f.ts': 'f1',
  'src/core/g.ts': 'g1',
});
const NEXT = coreFiles('0.12.0', { next: '16.1.0', zod: '4.0.0' }, {
  'src/core/a.ts': 'a2',
  'src/core/b.ts': 'b1',
  'src/core/c.ts': 'c2',
  'src/core/f.ts': 'f2',
  'src/core/g.ts': 'g1',
  'src/core/new.ts': 'n',
  'src/core/taken.ts': 't2',
  'src/core/prisma/migrations/20260101000000_add_thing/migration.sql': 'CREATE TABLE "Thing" ();',
});

// 0.11.2에서 만든 프로젝트를 흉내 낸다: 앱 이름과 버전을 바꾸고, 코어 파일 몇 개를 고치거나 지웠다.
// local을 주면 기본 수정 대신, 기준 그대로의 프로젝트에 그 파일들만 덮어쓴다(값이 null이면 지운다).
async function setup(t, { baseline = true, base = BASE, next = NEXT, local = null } = {}) {
  const releases = new Map();
  if (baseline) releases.set('0.11.2', await buildRelease(t, base));
  releases.set('0.12.0', await buildRelease(t, next));
  const state = { releases, body: null, published: [] };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
    const authorized = req.headers.authorization === `Bearer ${TOKEN}`;
    if (url.pathname === '/api/store/keys') return json({ keys: [{ keyId: 'test-key', publicKey: publicPem }] });
    if (url.pathname === '/api/store/connection') return authorized ? json({ accountName: '테스트', tokenName: '프로젝트' }) : json({ error: 'no' }, 401);
    if (url.pathname === '/api/store/core' && req.method === 'POST') {
      // 실제 Store 서버는 출처가 자기 자신이 아닌 POST를 라우트에 닿기 전에 거절한다.
      if (req.headers.origin !== `http://${req.headers.host}`) return json({ error: 'Invalid request origin' }, 403);
      if (req.headers.authorization !== `Bearer ${PUBLISH_TOKEN}`) return json({ error: 'no' }, 401);
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const { metadata } = signRelease(Buffer.concat(chunks));
      state.published.push(metadata.manifest);
      return json({ version: metadata.manifest.version, sha256: metadata.sha256, created: true }, 201);
    }
    if (url.pathname === '/api/store/core') return json({ releases: [...state.releases.keys()].map(version => ({ version, size: 1, releasedAt: '' })) });
    const release = state.releases.get(url.pathname.replace('/api/store/core/', ''));
    if (release) {
      if (!authorized) return json({ error: 'no' }, 401);
      if (url.searchParams.get('metadata') === '1') return json(release.metadata);
      res.writeHead(200, { 'Content-Type': 'application/zip' });
      return res.end(state.body ?? release.zip);
    }
    json({ error: 'not found' }, 404);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'core-update-'));
  t.after(async () => { server.close(); await fs.rm(root, { recursive: true, force: true }); });
  const mine = local ?? {
    'package.json': packageJson('my-site', '3.4.5', { next: '16.0.0' }),
    'src/core/b.ts': 'b-mine',
    'src/core/c.ts': 'c-mine',
    'src/core/e.ts': 'e-mine',
    'src/core/taken.ts': 't-mine',
    'src/extensions/site/index.ts': 'mine',
    'src/core/f.ts': null,
    'src/core/g.ts': null,
  };
  await writeFiles(root, { ...base, ...Object.fromEntries(Object.entries(mine).filter(([, text]) => text !== null)) });
  for (const [file, text] of Object.entries(mine)) if (text === null) await fs.rm(path.join(root, file));
  const storeUrl = `http://127.0.0.1:${server.address().port}`;
  await lib.connectStore(root, storeUrl, TOKEN);
  return {
    root, storeUrl, state,
    exists: file => fs.access(path.join(root, file)).then(() => true, () => false),
    read: file => fs.readFile(path.join(root, file), 'utf8'),
  };
}

const rejects = (promise, pattern) => assert.rejects(promise, error => error instanceof lib.InstallerError && pattern.test(error.message));

test('a core release holds core files only and identifies package.json without the app name and version', () => {
  const files = sources => new Map(Object.entries(sources).map(([file, text]) => [file, Buffer.from(text)]));
  assert.equal(core.buildCoreManifest(files(BASE)).version, '0.11.2');
  for (const file of ['src/extensions/site/index.ts', 'src/packages/demo/index.ts', 'src/packages/index.ts', 'prisma/schema.prisma', 'public/logo.png', '.github/workflows/ci.yml', '.env.local', '../outside.ts']) {
    assert.equal(core.isCoreReleasePath(file), false, file);
    assert.throws(() => core.buildCoreManifest(files({ ...BASE, [file]: 'x' })), lib.InstallerError);
  }
  assert.equal(core.isCoreReleasePath('src/packages/README.md'), true);
  assert.throws(() => core.buildCoreManifest(files({ 'package.json': '{}' })), /버전/);
  assert.throws(() => core.buildCoreManifest(files({ 'src/core/plextype.json': '{"version":"1.0.0"}' })), /package\.json/);

  const hash = text => core.packageJsonCoreSha256(Buffer.from(text));
  assert.equal(hash(packageJson('plextype', '0.1.0', { next: '16.0.0' })), hash(packageJson('my-site', '3.4.5', { next: '16.0.0' })));
  assert.notEqual(hash(packageJson('plextype', '0.1.0', { next: '16.0.0' })), hash(packageJson('plextype', '0.1.0', { next: '16.1.0' })));
  assert.equal(hash('not json'), null);
});

test('the preview sorts every file by who changed it since the installed release', async t => {
  const { root, read } = await setup(t);
  const preview = await core.previewCoreUpdate(root);
  assert.deepEqual([preview.currentVersion, preview.version, preview.hasBaseline, preview.blockers], ['0.11.2', '0.12.0', true, []]);
  assert.deepEqual(preview.writes, [
    { path: 'package.json', change: 'changed' },
    { path: 'src/core/a.ts', change: 'changed' },
    { path: 'src/core/new.ts', change: 'added' },
    { path: 'src/core/plextype.json', change: 'changed' },
    { path: 'src/core/prisma/migrations/20260101000000_add_thing/migration.sql', change: 'added' },
  ]);
  assert.deepEqual(preview.removes, ['src/core/old/d.ts']);
  assert.deepEqual(preview.kept, ['src/core/b.ts']);
  assert.deepEqual(preview.conflicts, [
    { path: 'src/core/c.ts', kind: 'modified' },
    { path: 'src/core/e.ts', kind: 'removed' },
    { path: 'src/core/f.ts', kind: 'deleted' },
    { path: 'src/core/taken.ts', kind: 'occupied' },
  ]);
  assert.deepEqual(preview.dependencies, ['next', 'zod']);
  assert.deepEqual(preview.migrations, ['20260101000000_add_thing']);
  // 미리 보기는 아무것도 쓰지 않는다.
  assert.equal(await read('src/core/a.ts'), 'a1');
  // 충돌이 있으면 어떻게 할지 정하지 않고는 적용되지 않는다.
  await rejects(core.applyCoreUpdate(root, { version: preview.version, sha256: preview.sha256 }), /충돌/);
  await rejects(core.applyCoreUpdate(root, { version: preview.version, sha256: 'f'.repeat(64), conflicts: 'keep' }), /바뀌었습니다/);
  assert.equal(await read('src/core/a.ts'), 'a1');
});

test('applying keeps my edits, saves the incoming side for them, and leaves the replaced files in the backup', async t => {
  const { root, exists, read } = await setup(t);
  const preview = await core.previewCoreUpdate(root);
  const result = await core.applyCoreUpdate(root, { version: preview.version, sha256: preview.sha256, conflicts: 'keep' });
  assert.deepEqual([result.previousVersion, result.version, result.written, result.removed], ['0.11.2', '0.12.0', 5, 1]);
  assert.deepEqual(result.keptConflicts, ['src/core/c.ts', 'src/core/e.ts', 'src/core/f.ts', 'src/core/taken.ts']);

  assert.equal(JSON.parse(await read('src/core/plextype.json')).version, '0.12.0');
  // 앱 이름과 앱 버전은 프로젝트의 것으로 남고, 나머지는 새 버전의 것이 된다.
  assert.deepEqual(JSON.parse(await read('package.json')), { name: 'my-site', version: '3.4.5', dependencies: { next: '16.1.0', zod: '4.0.0' } });
  assert.deepEqual([await read('src/core/a.ts'), await read('src/core/new.ts'), await read('src/core/b.ts')], ['a2', 'n', 'b-mine']);
  assert.deepEqual([await read('src/core/c.ts'), await read('src/core/e.ts'), await read('src/core/taken.ts')], ['c-mine', 'e-mine', 't-mine']);
  // 지워진 파일만 있던 폴더는 함께 사라지고, 직접 지운 파일은 다시 생기지 않는다.
  assert.deepEqual([await exists('src/core/old'), await exists('src/core/f.ts'), await exists('src/core/g.ts')], [false, false, false]);
  assert.equal(await read('src/extensions/site/index.ts'), 'mine');

  assert.equal(result.referencePath, '.plextype/reference/core-0.12.0');
  assert.deepEqual([await read(`${result.referencePath}/src/core/c.ts`), await read(`${result.referencePath}/src/core/f.ts`), await read(`${result.referencePath}/src/core/taken.ts`)], ['c2', 'f2', 't2']);
  assert.deepEqual([await read(`${result.backupPath}/src/core/a.ts`), await read(`${result.backupPath}/src/core/old/d.ts`)], ['a1', 'd1']);
  assert.equal(await exists('.plextype/tmp'), true);
  assert.deepEqual(await fs.readdir(path.join(root, '.plextype/tmp')), []);

  assert.ok(core.coreUpdateNextSteps(result).some(step => step === 'npm install'));
  assert.ok(core.coreUpdateNextSteps(result).some(step => step.includes('plextype -- migrate')));
  await rejects(core.previewCoreUpdate(root), /새 버전이 없습니다/);
});

test('overwriting takes the new release for every conflict', async t => {
  const { root, exists, read } = await setup(t);
  const preview = await core.previewCoreUpdate(root);
  const result = await core.applyCoreUpdate(root, { version: preview.version, sha256: preview.sha256, conflicts: 'overwrite' });
  assert.deepEqual([result.written, result.removed, result.keptConflicts, result.referencePath], [8, 2, [], null]);
  assert.deepEqual([await read('src/core/c.ts'), await read('src/core/f.ts'), await read('src/core/taken.ts'), await exists('src/core/e.ts')], ['c2', 'f2', 't2', false]);
  assert.equal(await read('src/core/b.ts'), 'b-mine');
  assert.deepEqual([await read(`${result.backupPath}/src/core/c.ts`), await read(`${result.backupPath}/src/core/e.ts`)], ['c-mine', 'e-mine']);
});

test('without the installed release on the Store, differing files can only be replaced', async t => {
  const { root, read, exists } = await setup(t, { baseline: false });
  const preview = await core.previewCoreUpdate(root);
  assert.equal(preview.hasBaseline, false);
  assert.deepEqual(preview.removes, []);
  assert.ok(preview.conflicts.every(file => file.kind === 'occupied'));
  assert.deepEqual(preview.conflicts.map(file => file.path), ['package.json', 'src/core/a.ts', 'src/core/b.ts', 'src/core/c.ts', 'src/core/plextype.json', 'src/core/taken.ts']);
  await rejects(core.applyCoreUpdate(root, { version: preview.version, sha256: preview.sha256, conflicts: 'keep' }), /가려낼 수 없습니다/);
  assert.equal(JSON.parse(await read('src/core/plextype.json')).version, '0.11.2');
  await core.applyCoreUpdate(root, { version: preview.version, sha256: preview.sha256, conflicts: 'overwrite' });
  assert.deepEqual([await read('src/core/b.ts'), JSON.parse(await read('package.json')).name], ['b1', 'my-site']);
  // 기준이 없으면 새 버전에서 없어진 파일을 알 수 없어 남는다.
  assert.equal(await exists('src/core/old/d.ts'), true);
});

test('a file renamed only by letter case ends up under its new name, and never on top of an edited one', async t => {
  const base = coreFiles('0.11.2', {}, { 'src/core/Widget.ts': 'w1', 'src/core/Panel.ts': 'p1' });
  const next = coreFiles('0.12.0', {}, { 'src/core/widget.ts': 'w1', 'src/core/panel.ts': 'p2' });
  const { root, read } = await setup(t, { base, next, local: { 'src/core/Panel.ts': 'p-mine' } });
  const names = async () => (await fs.readdir(path.join(root, 'src/core'))).filter(name => /widget|panel/i.test(name)).sort();

  const preview = await core.previewCoreUpdate(root);
  assert.deepEqual(preview.removes, ['src/core/Widget.ts']);
  assert.ok(preview.conflicts.some(file => file.path === 'src/core/Panel.ts' && file.kind === 'removed'));
  await core.applyCoreUpdate(root, { version: preview.version, sha256: preview.sha256, conflicts: 'keep' });
  // 대소문자를 구분하지 않는 파일 시스템에서도 고치지 않은 파일은 새 이름으로 남고, 고친 파일은 그 이름과 내용 그대로다.
  assert.equal(await read('src/core/widget.ts'), 'w1');
  assert.ok((await names()).includes('widget.ts') && !(await names()).includes('Widget.ts'));
  assert.ok((await names()).includes('Panel.ts'));
  assert.equal(await read('src/core/Panel.ts'), 'p-mine');
});

test('a file that becomes a folder is moved aside first, and an untouched path I replaced with a folder is left alone', async t => {
  const base = coreFiles('0.11.2', {}, { 'src/core/mod': 'file', 'src/core/same.ts': 's1' });
  const next = coreFiles('0.12.0', {}, { 'src/core/mod/index.ts': 'folder', 'src/core/same.ts': 's1' });
  const { root, read } = await setup(t, { base, next, local: { 'src/core/same.ts': null } });
  await fs.mkdir(path.join(root, 'src/core/same.ts'));

  const preview = await core.previewCoreUpdate(root);
  assert.deepEqual([preview.blockers, preview.conflicts, preview.kept], [[], [], ['src/core/same.ts']]);
  const result = await core.applyCoreUpdate(root, { version: preview.version, sha256: preview.sha256 });
  assert.equal(await read('src/core/mod/index.ts'), 'folder');
  assert.equal(await read(`${result.backupPath}/src/core/mod`), 'file');
  assert.ok((await fs.stat(path.join(root, 'src/core/same.ts'))).isDirectory());
});

test('a failure while writing puts every file back and leaves no backup behind', async t => {
  const next = { ...NEXT, 'src/core/zz/late.ts': 'late' };
  const { root, read, exists } = await setup(t, { next });
  // 새 버전이 폴더로 쓰는 자리에 파일이 있으면, 앞선 파일들을 다 바꾼 뒤 마지막에서 실패한다.
  await writeFiles(root, { 'src/core/zz': 'in the way' });
  const preview = await core.previewCoreUpdate(root);
  await rejects(core.applyCoreUpdate(root, { version: preview.version, sha256: preview.sha256, conflicts: 'overwrite' }), /적용 전 상태로 되돌렸습니다/);
  assert.deepEqual([await read('src/core/a.ts'), await read('src/core/c.ts'), await read('src/core/old/d.ts'), await read('src/core/zz')], ['a1', 'c-mine', 'd1', 'in the way']);
  assert.equal(JSON.parse(await read('src/core/plextype.json')).version, '0.11.2');
  assert.deepEqual([await exists('src/core/new.ts'), await exists('src/core/prisma')], [false, false]);
  assert.deepEqual([await fs.readdir(path.join(root, '.plextype/tmp')), await fs.readdir(path.join(root, '.plextype/backup'))], [[], []]);
});

test('work that belongs to files I kept is not listed as something to run', async t => {
  const { root } = await setup(t, { local: { 'package.json': packageJson('my-site', '3.4.5', { next: '15.0.0' }) } });
  const preview = await core.previewCoreUpdate(root);
  assert.deepEqual(preview.conflicts, [{ path: 'package.json', kind: 'modified' }]);
  const result = await core.applyCoreUpdate(root, { version: preview.version, sha256: preview.sha256, conflicts: 'keep' });
  assert.deepEqual([result.dependencies, result.migrations], [[], ['20260101000000_add_thing']]);
  assert.ok(!core.coreUpdateNextSteps(result).includes('npm install'));
});

test('a release that fails verification changes nothing', async t => {
  const { root, state, read } = await setup(t);
  const release = state.releases.get('0.12.0');

  state.body = Buffer.concat([release.zip, Buffer.from('x')]);
  await rejects(core.previewCoreUpdate(root), /서명된 코어 배포본과 다릅니다/);
  state.body = null;

  const forged = structuredClone(release.metadata);
  forged.manifest.files.find(file => file.path === 'src/core/a.ts').sha256 = digest('evil');
  state.releases.set('0.12.0', { ...release, metadata: forged });
  await rejects(core.previewCoreUpdate(root), /서명을 확인하지 못했습니다/);
  state.releases.set('0.12.0', release);

  // 폴더가 프로젝트 밖을 가리키는 링크면 그 안에 쓰지 않는다.
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'core-outside-'));
  t.after(() => fs.rm(outside, { recursive: true, force: true }));
  await fs.rm(path.join(root, 'src/core/prisma'), { recursive: true, force: true });
  await fs.symlink(outside, path.join(root, 'src/core/prisma'));
  const preview = await core.previewCoreUpdate(root);
  assert.match(preview.blockers.join('\n'), /migration\.sql 자리에 폴더나 링크/);
  await rejects(core.applyCoreUpdate(root, { version: preview.version, sha256: preview.sha256, conflicts: 'keep' }), /폴더나 링크/);
  assert.deepEqual(await fs.readdir(outside), []);
  assert.equal(await read('src/core/a.ts'), 'a1');
});

test('the source repository and production never take a core release', async t => {
  const { root } = await setup(t);
  await writeFiles(root, { '.github/workflows/sync-to-plextype.yml': 'name: Sync' });
  assert.equal(await core.isCoreSource(root), true);
  await rejects(core.previewCoreUpdate(root), /원본/);
  await fs.rm(path.join(root, '.github'), { recursive: true });

  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  t.after(() => { process.env.NODE_ENV = previous; });
  await rejects(core.previewCoreUpdate(root), /개발 환경에서만/);
});

test('finishing runs npm install, the Prisma client build and the migration in order and stops at the first failure', async t => {
  const database = await import('../src/modules/installer/lib/applyDatabase.ts');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'core-finish-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  // 실제 명령 대신, 불린 순서를 파일에 적는 npm 스크립트를 둔다. npm install은 받을 라이브러리가 없어 바로 끝난다.
  const log = step => `node -e "require('fs').appendFileSync('ran.log', '${step}\\n')"`;
  const scripts = { 'prisma:generate': log('generate'), 'migrate:deploy': log('migrate') };
  const write = value => fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'finish-test', version: '1.0.0', private: true, scripts: value }));
  const ran = () => fs.readFile(path.join(root, 'ran.log'), 'utf8').catch(() => '');

  await write(scripts);
  assert.deepEqual(await database.finishCoreUpdate(root, { dependencies: [], migrations: [] }), { completed: true, ran: ['npm run prisma:generate'], remaining: [], output: '' });
  assert.equal(await ran(), 'generate\n');
  assert.deepEqual((await database.finishCoreUpdate(root, { dependencies: ['next'], migrations: ['20260101000000_add_thing'] })).ran, ['npm install', 'npm run prisma:generate', 'npm run migrate:deploy']);
  assert.equal(await ran(), 'generate\ngenerate\nmigrate\n');

  await write({ ...scripts, 'prisma:generate': 'node -e "console.error(\'schema broke\'); process.exit(1)"' });
  const stopped = await database.finishCoreUpdate(root, { dependencies: [], migrations: ['20260101000000_add_thing'] });
  assert.deepEqual([stopped.completed, stopped.ran, stopped.remaining], [false, [], ['npm run prisma:generate', 'npm run migrate:deploy']]);
  assert.match(stopped.output, /schema broke/);
  assert.equal(await ran(), 'generate\ngenerate\nmigrate\n');
});

test('the release script packs tracked core files and uploads them with the publish token', async t => {
  const { storeUrl, state } = await setup(t);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'core-publish-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await writeFiles(root, {
    ...NEXT,
    'src/packages/README.md': 'readme',
    'src/packages/index.ts': 'generated',
    'src/extensions/site/index.ts': 'mine',
    'prisma/schema.prisma': 'generated',
    'public/logo.png': 'image',
    'untracked.ts': 'not in git',
  });
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  git('init', '-q');
  git('add', '--', ...Object.keys(NEXT), 'src/packages', 'src/extensions', 'prisma', 'public');
  git('-c', 'user.name=test', '-c', 'user.email=test@example.com', 'commit', '-q', '-m', 'release');
  // 커밋한 뒤 작업 폴더에서 바뀐 내용(빌드가 고친 파일 등)은 배포본에 들어가지 않는다.
  await writeFiles(root, { 'src/core/a.ts': 'changed after the commit' });

  assert.deepEqual(listCoreFiles(root), [...Object.keys(NEXT), 'src/packages/README.md'].sort());
  // 같은 커밋에서는 같은 바이트가 나와야 다시 올렸을 때 같은 배포본으로 인정된다.
  const zip = buildCoreZip(listCoreFiles(root), readCommitted(root));
  assert.deepEqual(zip, buildCoreZip(listCoreFiles(root), readCommitted(root)));
  assert.equal(lib.readZipEntries(zip).get('src/core/a.ts').toString(), 'a2');

  await assert.rejects(publishCore(root, { storeUrl, token: 'wrong' }), /401/);
  assert.deepEqual(await publishCore(root, { storeUrl, token: PUBLISH_TOKEN }), { version: '0.12.0', size: zip.length, created: true });
  assert.deepEqual(state.published[0].files.map(file => file.path), listCoreFiles(root));
});
