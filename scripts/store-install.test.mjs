// 쉬운 설치의 연결·검증·설치·업데이트·제거를, 서명까지 실제로 하는 가짜 Store 서버와 임시 프로젝트 폴더로 확인한다.
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { deflateRawSync } from 'node:zlib';

import { renderExtensionRoute } from './extension-files.mjs';

const lib = await import('../src/modules/installer/lib/storeInstall.ts');
const TOKEN = `pxt_${'a'.repeat(16)}_${'b'.repeat(48)}`;
const digest = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  : JSON.stringify(value);

// 항목마다 저장(0)과 deflate(8)를 번갈아 쓰는 최소 ZIP.
function zip(entries) {
  const locals = [];
  const central = [];
  let offset = 0;
  entries.forEach(([name, content], index) => {
    const nameBytes = Buffer.from(name);
    const method = index % 2 ? 8 : 0;
    const data = method ? deflateRawSync(content) : content;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(method, 8);
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(content.length, 22); local.writeUInt16LE(nameBytes.length, 26);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0); header.writeUInt16LE(method, 10);
    header.writeUInt32LE(data.length, 20); header.writeUInt32LE(content.length, 24); header.writeUInt16LE(nameBytes.length, 28);
    header.writeUInt32LE(offset, 42);
    locals.push(local, nameBytes, data);
    central.push(header, nameBytes);
    offset += 30 + nameBytes.length + data.length;
  });
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const publicPem = publicKey.export({ format: 'pem', type: 'spki' }).toString();

const signPayload = body => sign(null, Buffer.from(canonical(body)), privateKey).toString('base64');

function buildPackage(version, sources, { keyId = 'test-key', min = '0.1.0' } = {}) {
  const files = Object.entries(sources).map(([name, text]) => [name, Buffer.from(text)]);
  const manifest = {
    schemaVersion: 1, type: 'plextype-extension', productUuid: 'product-demo', packageId: 'demo', version,
    minPlatformVersion: min, maxPlatformVersion: null, installPath: 'src/packages/demo',
    files: files.map(([name, content]) => ({ path: name, size: content.length, sha256: digest(content) })),
    requiresDatabaseReview: false,
  };
  const content = zip([...files.map(([name, data]) => [`demo/${name}`, data]), ['demo/plextype.package.json', Buffer.from(JSON.stringify(manifest))]]);
  const metadata = { manifest, sha256: digest(content), size: content.length };
  return { content, metadata: { versionUuid: `version-${version.replaceAll(".", "")}`, ...metadata, signature: {
    algorithm: 'Ed25519', keyId, publicKey: 'ignored-by-installer',
    value: sign(null, Buffer.from(canonical(metadata)), privateKey).toString('base64'),
  } } };
}

const route = (name, file) => ({ route: `src/app/(extensions)/demo/${name}page.tsx`, implementation: `src/packages/demo/routes/${file}`, configs: ['export const dynamic = "force-dynamic";'] });
const first = buildPackage('0.1.0', {
  'index.ts': 'export const demo = 1;\n',
  'routes/list.tsx': 'export default function List() { return null; }\n',
  'routes/detail.tsx': 'export default function Detail() { return null; }\n',
  'routes.json': JSON.stringify([route('', 'list.tsx'), route('[id]/', 'detail.tsx')]),
});
const second = buildPackage('0.2.0', {
  'index.ts': 'export const demo = 2;\n',
  'routes/list.tsx': 'export default function List() { return null; }\n',
  'routes.json': JSON.stringify([route('', 'list.tsx')]),
});

async function setup(t, current = first) {
  const state = { current, body: null };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
    const authorized = req.headers.authorization === `Bearer ${TOKEN}`;
    if (url.pathname === '/api/store/keys') return json({ keys: [{ keyId: 'test-key', publicKey: publicPem }] });
    if (url.pathname === '/api/store/connection') return authorized ? json({ accountName: '테스트', tokenName: '프로젝트' }) : json({ error: 'no' }, 401);
    if (url.pathname === '/api/store/products/product-demo/download') {
      if (!authorized) return json({ error: 'no' }, 401);
      if (url.searchParams.get('metadata') === '1') return json(state.current.metadata);
      res.writeHead(200, { 'Content-Type': 'application/zip' });
      return res.end(state.body ?? state.current.content);
    }
    json({ error: 'not found' }, 404);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'store-install-'));
  t.after(async () => { server.close(); await fs.rm(root, { recursive: true, force: true }); });
  await fs.mkdir(path.join(root, 'src/app'), { recursive: true });
  await fs.mkdir(path.join(root, 'src/core'), { recursive: true });
  await fs.writeFile(path.join(root, 'src/core/plextype.json'), JSON.stringify({ version: '0.11.2' }));
  const storeUrl = `http://127.0.0.1:${server.address().port}`;
  return { root, storeUrl, state, exists: file => fs.access(path.join(root, file)).then(() => true, () => false), read: file => fs.readFile(path.join(root, file), 'utf8') };
}

const rejects = (promise, pattern) => assert.rejects(promise, error => error instanceof lib.InstallerError && pattern.test(error.message));

test('store addresses must be https unless they point at this computer', () => {
  assert.equal(lib.normalizeStoreUrl('https://gjworks.dev/store/'), 'https://gjworks.dev');
  assert.equal(lib.normalizeStoreUrl('http://localhost:3000'), 'http://localhost:3000');
  for (const value of ['http://gjworks.dev', 'ftp://gjworks.dev', 'https://user:pw@gjworks.dev', 'gjworks.dev']) {
    assert.throws(() => lib.normalizeStoreUrl(value), lib.InstallerError);
  }
});

test('connecting needs a valid token and pins the signing keys in an owner-only file', async t => {
  const { root, storeUrl } = await setup(t);
  await rejects(lib.connectStore(root, storeUrl, 'not-a-token'), /형식/);
  await rejects(lib.connectStore(root, storeUrl, `pxt_${'c'.repeat(16)}_${'d'.repeat(48)}`), /유효하지/);
  // 이 가짜 Store에는 목록 주소가 없다. 쉬운 설치용 주소가 없는 사이트는 주소를 확인하라고 알린다.
  await rejects(lib.fetchCatalog(storeUrl), /쉬운 설치 연결을 지원하지 않습니다/);
  assert.equal(await lib.readConnection(root), null);
  const connection = await lib.connectStore(root, storeUrl, TOKEN);
  assert.deepEqual(connection.keys, [{ keyId: 'test-key', publicKey: publicPem }]);
  assert.equal((await fs.stat(path.join(root, '.plextype/store.json'))).mode & 0o777, 0o600);
  await lib.disconnectStore(root);
  assert.equal(await lib.readConnection(root), null);
});

test('installing writes the signed files and the same route adapters the sync script would write', async t => {
  const { root, storeUrl, exists, read } = await setup(t);
  await rejects(lib.installStorePackage(root, 'product-demo'), /먼저 Store에 연결/);
  await lib.connectStore(root, storeUrl, TOKEN);
  const result = await lib.installStorePackage(root, 'product-demo');
  assert.deepEqual([result.packageId, result.version, result.previousVersion], ['demo', '0.1.0', null]);
  assert.equal(await read('src/packages/demo/index.ts'), 'export const demo = 1;\n');
  assert.equal(JSON.parse(await read('src/packages/demo/plextype.package.json')).version, '0.1.0');
  for (const entry of [route('', 'list.tsx'), route('[id]/', 'detail.tsx')]) {
    assert.equal(await read(entry.route), renderExtensionRoute(entry));
  }
  assert.equal(await exists('.plextype/tmp/demo'), false);
  // 이 패키지에는 registry 파일이 없어 등록 목록에 들어가지 않는다.
  assert.equal(result.registered, false);
  assert.match(await read('src/packages/index.ts'), /installedPackages: ExtensionRegistryConfig\[\] = \[\];/);
});

test('packages with a registry file are listed for registration, and the list follows installs and removals', async t => {
  const withRegistry = buildPackage('0.3.0', { 'index.ts': 'export {};\n', 'registry.tsx': 'export default { modules: [] };\n' });
  const { root, storeUrl, read } = await setup(t, withRegistry);
  await lib.connectStore(root, storeUrl, TOKEN);
  assert.equal((await lib.installStorePackage(root, 'product-demo')).registered, true);
  const list = await read('src/packages/index.ts');
  assert.match(list, /import package0 from "\.\/demo\/registry";/);
  assert.match(list, /= \[package0\];/);
  await lib.uninstallStorePackage(root, 'demo');
  assert.doesNotMatch(await read('src/packages/index.ts'), /demo/);
});

test('packages with a triggers, login providers or social providers file are listed for the server, apart from the registry list', async t => {
  const withTriggers = buildPackage('0.3.0', { 'index.ts': 'export {};\n', 'triggers.ts': 'export default {};\n', 'loginProviders.tsx': 'export default () => [];\n', 'socialProviders.ts': 'export default [];\n' });
  const { root, storeUrl, read } = await setup(t, withTriggers);
  await lib.connectStore(root, storeUrl, TOKEN);
  // registry 파일이 없으므로 관리자 메뉴·스킨 목록에는 들어가지 않는다.
  assert.equal((await lib.installStorePackage(root, 'product-demo')).registered, false);
  assert.doesNotMatch(await read('src/packages/index.ts'), /demo/);
  const list = await read('src/packages/installedTriggers.ts');
  assert.match(list, /import package0 from "\.\/demo\/triggers";/);
  assert.match(list, /installedTriggers: PackageTriggers\[\] = \[package0\];/);
  const providers = await read('src/packages/installedLoginProviders.ts');
  assert.match(providers, /import package0 from "\.\/demo\/loginProviders";/);
  assert.match(providers, /installedLoginProviders: LoginProviderSource\[\] = \[package0\];/);
  const social = await read('src/packages/installedSocialProviders.ts');
  assert.match(social, /import package0 from "\.\/demo\/socialProviders";/);
  assert.match(social, /installedSocialProviders: ProviderDefinition\[\]\[\] = \[package0\];/);

  // 내 확장으로 가져오면 새 위치를 가리키고, 제거하면 목록에서 빠진다.
  await lib.adoptStorePackage(root, 'demo');
  assert.match(await read('src/packages/installedTriggers.ts'), /import package0 from "@\/extensions\/demo\/triggers";/);
  assert.match(await read('src/packages/installedLoginProviders.ts'), /import package0 from "@\/extensions\/demo\/loginProviders";/);
  assert.match(await read('src/packages/installedSocialProviders.ts'), /import package0 from "@\/extensions\/demo\/socialProviders";/);
  await lib.discardAdoptedPackage(root, 'demo');
  assert.match(await read('src/packages/installedTriggers.ts'), /installedTriggers: PackageTriggers\[\] = \[\];/);
  assert.match(await read('src/packages/installedLoginProviders.ts'), /installedLoginProviders: LoginProviderSource\[\] = \[\];/);
  assert.match(await read('src/packages/installedSocialProviders.ts'), /installedSocialProviders: ProviderDefinition\[\]\[\] = \[\];/);
});

test('updating replaces the folder, drops routes the new version no longer has, and keeps a backup', async t => {
  const { root, storeUrl, state, exists, read } = await setup(t);
  await lib.connectStore(root, storeUrl, TOKEN);
  await lib.installStorePackage(root, 'product-demo');
  state.current = second;
  const result = await lib.installStorePackage(root, 'product-demo');
  assert.equal(result.previousVersion, '0.1.0');
  assert.equal(await read('src/packages/demo/index.ts'), 'export const demo = 2;\n');
  assert.equal(await exists('src/packages/demo/routes/detail.tsx'), false);
  assert.equal(await exists('src/app/(extensions)/demo/[id]/page.tsx'), false);
  assert.equal(await exists('src/app/(extensions)/demo/page.tsx'), true);
  assert.equal((await fs.readdir(path.join(root, '.plextype/backup'))).length, 1);
});

test('nothing is written when the download, signature, platform or destination does not check out', async t => {
  const cases = [
    ['a changed file body', ctx => { ctx.state.body = Buffer.concat([first.content, Buffer.from('x')]); }, /서명된 패키지와 다릅니다/],
    ['a key the project never pinned', ctx => { ctx.state.current = buildPackage('0.1.0', { 'index.ts': 'x' }, { keyId: 'other-key' }); }, /서명을 확인하지/],
    ['a manifest edited after signing', ctx => { ctx.state.current = { ...first, metadata: { ...first.metadata, manifest: { ...first.metadata.manifest, version: '9.9.9' } } }; }, /서명을 확인하지/],
    ['a newer platform requirement', ctx => { ctx.state.current = buildPackage('0.1.0', { 'index.ts': 'x' }, { min: '1.0.0' }); }, /현재 버전은 0\.11\.2/],
    ['a folder the installer did not create', async ctx => { await fs.mkdir(path.join(ctx.root, 'src/packages/demo'), { recursive: true }); await fs.writeFile(path.join(ctx.root, 'src/packages/demo/mine.ts'), 'mine'); }, /덮어쓰지 않습니다/],
    ['a hand-written route', async ctx => { await fs.mkdir(path.join(ctx.root, 'src/app/(extensions)/demo'), { recursive: true }); await fs.writeFile(path.join(ctx.root, 'src/app/(extensions)/demo/page.tsx'), 'export default 1;'); }, /덮어쓰지 않습니다/],
  ];
  for (const [name, arrange, pattern] of cases) {
    await t.test(name, async t => {
      const ctx = await setup(t);
      await lib.connectStore(ctx.root, ctx.storeUrl, TOKEN);
      await arrange(ctx);
      await rejects(lib.installStorePackage(ctx.root, 'product-demo'), pattern);
      assert.equal(await ctx.exists('src/packages/demo/index.ts'), false);
      assert.equal(await ctx.exists('src/app/(extensions)/demo/[id]/page.tsx'), false);
    });
  }
});

test('removing moves the folder to the backup area and deletes only its own adapters', async t => {
  const { root, storeUrl, exists } = await setup(t);
  await lib.connectStore(root, storeUrl, TOKEN);
  await fs.mkdir(path.join(root, 'src/packages/mine'), { recursive: true });
  await rejects(lib.uninstallStorePackage(root, 'mine'), /쉬운 설치로 넣은 패키지가 아니어서/);
  await lib.installStorePackage(root, 'product-demo');
  const result = await lib.uninstallStorePackage(root, 'demo');
  assert.equal(result.routes.length, 2);
  assert.equal(await exists('src/packages/demo'), false);
  assert.equal(await exists('src/app/(extensions)/demo/page.tsx'), false);
  assert.equal(await exists(`${result.backupPath}/index.ts`), true);
  assert.equal(await exists('src/packages/mine'), true);
});

test('previewing shows the SQL a package would apply without writing anything, and only the migrations that are new', async t => {
  const sql = name => `CREATE TABLE "${name}" ();\n`;
  const v1 = buildPackage('0.4.0', { 'index.ts': 'export {};\n', 'prisma/schema.prisma': 'model Demo {\n  id Int @id\n}\n', 'prisma/migrations/20260101000000_first/migration.sql': sql('First') });
  const v2 = buildPackage('0.5.0', { 'index.ts': 'export {};\n', 'prisma/schema.prisma': 'model Demo {\n  id Int @id\n}\n', 'prisma/migrations/20260101000000_first/migration.sql': sql('First'), 'prisma/migrations/20260201000000_second/migration.sql': sql('Second') });
  for (const item of [v1, v2]) item.metadata.manifest.requiresDatabaseReview = true;
  const sign = item => { const { versionUuid, signature, ...body } = item.metadata; item.metadata.signature.value = signPayload(body); };
  sign(v1); sign(v2);
  const { root, storeUrl, state, exists } = await setup(t, v1);
  await lib.connectStore(root, storeUrl, TOKEN);

  const preview = await lib.previewStorePackage(root, 'product-demo');
  assert.deepEqual([preview.hasDatabaseFiles, preview.previousVersion, preview.migrations.map(item => item.name)], [true, null, ['20260101000000_first']]);
  assert.equal(preview.migrations[0].sql, sql('First'));
  assert.equal(await exists('src/packages/demo'), false);

  const installed = await lib.installStorePackage(root, 'product-demo', { versionUuid: preview.versionUuid });
  assert.deepEqual(installed.newMigrations, ['20260101000000_first']);
  state.current = v2;
  assert.deepEqual((await lib.previewStorePackage(root, 'product-demo')).migrations.map(item => item.name), ['20260201000000_second']);
  assert.deepEqual((await lib.installStorePackage(root, 'product-demo')).newMigrations, ['20260201000000_second']);
  assert.deepEqual((await lib.uninstallStorePackage(root, 'demo')).migrations, ['20260101000000_first', '20260201000000_second']);
});

test('archives with escaping or secret paths are refused', () => {
  for (const name of ['demo/../../evil.ts', '/etc/passwd', 'demo/.env', 'demo/node_modules/x.js', 'demo\\evil.ts']) {
    assert.throws(() => lib.readZipEntries(zip([[name, Buffer.from('x')]])), lib.InstallerError, name);
  }
  assert.deepEqual([...lib.readZipEntries(zip([['demo/a.ts', Buffer.from('a')], ['demo/b.ts', Buffer.from('bb')]])).keys()], ['demo/a.ts', 'demo/b.ts']);
});

test('production refuses every change', async t => {
  const { root, storeUrl } = await setup(t);
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  t.after(() => { process.env.NODE_ENV = previous; });
  for (const work of [() => lib.connectStore(root, storeUrl, TOKEN), () => lib.installStorePackage(root, 'product-demo'), () => lib.uninstallStorePackage(root, 'demo'), () => lib.disconnectStore(root)]) {
    await rejects(work(), /개발 환경에서만/);
  }
});

test('applying the database runs the project\'s two npm scripts in order and reports where it stopped', async t => {
  const database = await import('../src/modules/installer/lib/applyDatabase.ts');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'apply-db-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const write = scripts => fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture', scripts }));
  const log = `node -e "require('fs').appendFileSync('ran.txt', process.argv[1] + ' ')"`;

  await write({ 'prisma:generate': `${log} generate`, 'migrate:deploy': `${log} migrate` });
  assert.deepEqual([(await database.applyPackageDatabase(root)).applied, await fs.readFile(path.join(root, 'ran.txt'), 'utf8')], [true, 'generate migrate ']);

  // 스키마를 합치는 단계에서 실패하면 마이그레이션은 시작하지 않는다. 출력에 섞인 접속 정보는 가린다.
  await fs.rm(path.join(root, 'ran.txt'));
  await write({ 'prisma:generate': `node -e "console.error('duplicate at postgresql://user:secret@db/app'); process.exit(1)"`, 'migrate:deploy': `${log} migrate` });
  const stopped = await database.applyPackageDatabase(root);
  assert.deepEqual([stopped.applied, stopped.failedStep], [false, 'generate']);
  assert.match(stopped.output, /duplicate/);
  assert.doesNotMatch(stopped.output, /secret/);
  await assert.rejects(fs.access(path.join(root, 'ran.txt')));

  await write({ 'prisma:generate': `${log} generate`, 'migrate:deploy': 'node -e "process.exit(2)"' });
  assert.equal((await database.applyPackageDatabase(root)).failedStep, 'migrate');

  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  t.after(() => { process.env.NODE_ENV = previous; });
  await rejects(database.applyPackageDatabase(root), /개발 환경에서만/);
});

// 패키지 여러 개와 목록 주소를 가진 가짜 Store. 필요한 패키지를 따라가는 동작을 확인하는 데 쓴다.
function named(packageId, version, { requires, sources = {} } = {}) {
  const files = Object.entries({ 'index.ts': `export const id = "${packageId}";\n`, ...sources }).map(([name, text]) => [name, Buffer.from(text)]);
  const manifest = {
    schemaVersion: 1, type: 'plextype-extension', productUuid: `product-${packageId}`, packageId, version,
    minPlatformVersion: '0.1.0', maxPlatformVersion: null, installPath: `src/packages/${packageId}`,
    files: files.map(([name, content]) => ({ path: name, size: content.length, sha256: digest(content) })),
    requiresDatabaseReview: false,
    ...(requires ? { requires: { node: null, packages: [], npm: [], ...requires } } : {}),
  };
  const content = zip([...files.map(([name, data]) => [`${packageId}/${name}`, data]), [`${packageId}/plextype.package.json`, Buffer.from(JSON.stringify(manifest))]]);
  const body = { manifest, sha256: digest(content), size: content.length };
  return { content, metadata: { versionUuid: `version-${packageId}-${version.replaceAll('.', '')}`, ...body, signature: { algorithm: 'Ed25519', keyId: 'test-key', value: signPayload(body) } } };
}

async function setupStore(t, packages) {
  const state = { packages: [...packages] };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
    if (url.pathname === '/api/store/keys') return json({ keys: [{ keyId: 'test-key', publicKey: publicPem }] });
    if (url.pathname === '/api/store/connection') return json({ accountName: '테스트', tokenName: '프로젝트' });
    if (url.pathname === '/api/store/catalog') return json({ products: state.packages.map(({ metadata: { manifest, size, versionUuid } }) => ({
      productUuid: manifest.productUuid, name: manifest.packageId, latest: { versionUuid, packageId: manifest.packageId, version: manifest.version, minPlatformVersion: manifest.minPlatformVersion, maxPlatformVersion: null, requiresDatabaseReview: false, size },
    })) });
    const item = state.packages.find(({ metadata }) => url.pathname === `/api/store/products/${metadata.manifest.productUuid}/download`);
    if (!item) return json({ error: 'not found' }, 404);
    if (url.searchParams.get('metadata') === '1') return json(item.metadata);
    res.writeHead(200, { 'Content-Type': 'application/zip' });
    res.end(item.content);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'store-deps-'));
  t.after(async () => { server.close(); await fs.rm(root, { recursive: true, force: true }); });
  await fs.mkdir(path.join(root, 'src/app'), { recursive: true });
  await fs.mkdir(path.join(root, 'src/core'), { recursive: true });
  await fs.writeFile(path.join(root, 'src/core/plextype.json'), JSON.stringify({ version: '0.11.2' }));
  await lib.connectStore(root, `http://127.0.0.1:${server.address().port}`, TOKEN);
  return { root, state, exists: file => fs.access(path.join(root, file)).then(() => true, () => false) };
}

test('required packages are installed first, and a package others need cannot be removed', async t => {
  const core = named('core', '1.2.0');
  const chart = named('chart', '2.0.0', { requires: { packages: [{ packageId: 'core', minVersion: '1.0.0' }] } });
  const app = named('app', '1.0.0', { requires: { packages: [{ packageId: 'chart', minVersion: '2.0.0' }, { packageId: 'core', minVersion: '1.2.0' }] } });
  const { root, exists } = await setupStore(t, [core, chart, app]);

  const preview = await lib.previewStorePackage(root, 'product-app');
  assert.deepEqual(preview.blockers, []);
  assert.deepEqual(preview.alsoInstalls.map(item => `${item.packageId}@${item.version}`), ['core@1.2.0', 'chart@2.0.0']);
  assert.equal(await exists('src/packages/core'), false);

  const expected = Object.fromEntries([...preview.alsoInstalls, preview].map(item => [item.packageId, item.versionUuid]));
  await rejects(lib.installStorePackage(root, 'product-app', { expected: { ...expected, core: 'another-version' } }), /버전이 바뀌었습니다/);
  assert.equal(await exists('src/packages/app'), false);

  const result = await lib.installStorePackage(root, 'product-app', { expected });
  assert.deepEqual([result.packageId, result.alsoInstalled.map(item => item.packageId)], ['app', ['core', 'chart']]);
  for (const id of ['core', 'chart', 'app']) assert.equal(await exists(`src/packages/${id}/index.ts`), true);
  // 이미 충분한 버전이 설치되어 있으면 다시 받지 않는다.
  assert.deepEqual((await lib.previewStorePackage(root, 'product-app')).alsoInstalls, []);

  await rejects(lib.uninstallStorePackage(root, 'core'), /app, chart 패키지가 core/);
  await rejects(lib.uninstallStorePackage(root, 'chart'), /app 패키지가 chart/);
  for (const id of ['app', 'chart', 'core']) await lib.uninstallStorePackage(root, id);
  assert.equal(await exists('src/packages/core'), false);
});

test('installation is blocked, with nothing written, when a requirement cannot be met', async t => {
  const tooOld = named('core', '0.9.0');
  const cases = [
    ['a required package the Store does not have', [named('app', '1.0.0', { requires: { packages: [{ packageId: 'ghost', minVersion: '1.0.0' }] } })], /ghost 1\.0\.0 이상을\(를\) Store에서 찾지 못했습니다/],
    ['a required version newer than the Store offers', [tooOld, named('app', '1.0.0', { requires: { packages: [{ packageId: 'core', minVersion: '1.0.0' }] } })], /Store의 최신 버전은 0\.9\.0/],
    ['a newer Node than this machine runs', [named('app', '1.0.0', { requires: { node: '999' } })], /Node 999\.0\.0 이상이 필요합니다/],
  ];
  for (const [name, packages, pattern] of cases) {
    await t.test(name, async t => {
      const { root, exists } = await setupStore(t, packages);
      const preview = await lib.previewStorePackage(root, 'product-app');
      assert.equal(preview.blockers.length, 1);
      assert.match(preview.blockers[0], pattern);
      await rejects(lib.installStorePackage(root, 'product-app'), pattern);
      assert.equal(await exists('src/packages/app'), false);
      assert.equal(await exists('src/packages/core'), false);
    });
  }
});

test('npm libraries are checked against what is installed; missing ones become a command to run, never an install', async t => {
  const app = named('app', '1.0.0', { requires: { npm: [{ name: '@scope/kit', range: '>=1.0.0' }, { name: 'chart.js', range: '^4.4.0' }, { name: 'dayjs', range: '^1.11.0' }] } });
  const { root, exists } = await setupStore(t, [app]);
  const install = async (name, version) => {
    await fs.mkdir(path.join(root, 'node_modules', name), { recursive: true });
    await fs.writeFile(path.join(root, 'node_modules', name, 'package.json'), JSON.stringify({ name, version }));
  };
  await install('chart.js', '3.9.1');
  await install('dayjs', '1.11.13');
  await fs.mkdir(path.join(root, 'src/extensions'), { recursive: true });
  await fs.writeFile(path.join(root, 'src/extensions/package.json'), '{}');

  const { npm, blockers } = await lib.previewStorePackage(root, 'product-app');
  assert.deepEqual(blockers, []);
  assert.deepEqual(npm.missing, [{ name: '@scope/kit', range: '>=1.0.0' }]);
  assert.deepEqual(npm.conflicts, [{ name: 'chart.js', range: '^4.4.0', installed: '3.9.1' }]);
  assert.equal(npm.command, 'npm install "@scope/kit@>=1.0.0" -w src/extensions');
  // 라이브러리가 모자라도 설치는 막지 않는다. 넣는 것은 사람이 한다.
  await lib.installStorePackage(root, 'product-app');
  assert.equal(await exists('node_modules/@scope/kit'), false);
});

test('version ranges follow the four forms the Store accepts', () => {
  for (const [version, range, expected] of [
    ['4.4.0', '^4.4.0', true], ['4.9.2', '^4.4.0', true], ['5.0.0', '^4.4.0', false], ['4.3.9', '^4.4.0', false],
    ['0.2.5', '^0.2.3', true], ['0.3.0', '^0.2.3', false], ['0.0.3', '^0.0.3', true], ['0.0.4', '^0.0.3', false],
    ['1.2.9', '~1.2.3', true], ['1.3.0', '~1.2.3', false], ['9.0.0', '>=1.2.3', true], ['1.2.2', '>=1.2.3', false],
    ['1.2.3', '1.2.3', true], ['1.2.4', '1.2.3', false], ['4.5.0-beta.1', '^4.4.0', true], ['4.4.0', 'latest', false],
  ]) assert.equal(lib.satisfiesRange(version, range), expected, `${version} ${range}`);
});

test('files edited after installation are reported before an update and are not overwritten without consent', async t => {
  const { root, storeUrl, state, read } = await setup(t);
  await lib.connectStore(root, storeUrl, TOKEN);
  await lib.installStorePackage(root, 'product-demo');
  assert.deepEqual(await lib.findLocalChanges(root, 'demo'), []);

  await fs.writeFile(path.join(root, 'src/packages/demo/index.ts'), 'export const demo = "mine";\n');
  await fs.writeFile(path.join(root, 'src/packages/demo/extra.ts'), 'export {};\n');
  await fs.rm(path.join(root, 'src/packages/demo/routes/detail.tsx'));
  const changes = [{ path: 'extra.ts', change: 'added' }, { path: 'index.ts', change: 'modified' }, { path: 'routes/detail.tsx', change: 'removed' }];
  assert.deepEqual(await lib.findLocalChanges(root, 'demo'), changes);

  state.current = second;
  assert.deepEqual((await lib.previewStorePackage(root, 'product-demo')).localChanges, [{ packageId: 'demo', files: changes }]);
  await rejects(lib.installStorePackage(root, 'product-demo'), /직접 고친 파일이 있어 업데이트하지 않았습니다: demo 3개/);
  assert.equal(await read('src/packages/demo/index.ts'), 'export const demo = "mine";\n');

  await lib.installStorePackage(root, 'product-demo', { overwriteLocalChanges: true });
  assert.equal(await read('src/packages/demo/index.ts'), 'export const demo = 2;\n');
  // 덮어쓴 수정은 백업 폴더에 남는다.
  const [backup] = await fs.readdir(path.join(root, '.plextype/backup'));
  assert.equal(await read(`.plextype/backup/${backup}/index.ts`), 'export const demo = "mine";\n');
});

test('adopting moves a package into the project\'s own extensions, and the installer then leaves it alone', async t => {
  const withImports = buildPackage('0.6.0', {
    'index.ts': 'export { helper } from "@/packages/demo/helper";\n',
    'helper.ts': 'export const helper = 1;\n',
    'registry.tsx': 'import { helper } from "@/packages/demo/helper";\nexport default { modules: [] };\n',
    'routes/list.tsx': 'export default function List() { return null; }\n',
    'routes.json': JSON.stringify([route('', 'list.tsx')]),
  });
  const newer = buildPackage('0.7.0', { 'index.ts': 'export const next = true;\n' });
  const { root, storeUrl, state, exists, read } = await setup(t, withImports);
  await lib.connectStore(root, storeUrl, TOKEN);
  await lib.installStorePackage(root, 'product-demo');

  const adopted = await lib.adoptStorePackage(root, 'demo');
  assert.deepEqual([adopted.path, adopted.version, adopted.hadLocalChanges], ['src/extensions/demo', '0.6.0', false]);
  assert.equal(await exists('src/packages/demo'), false);
  // 자기 위치를 가리키던 경로와 연결 파일, 등록 목록이 새 위치를 가리킨다.
  assert.equal(await read('src/extensions/demo/index.ts'), 'export { helper } from "@/extensions/demo/helper";\n');
  assert.match(await read('src/extensions/demo/routes.json'), /"src\/extensions\/demo\/routes\/list\.tsx"/);
  assert.equal(await read('src/app/(extensions)/demo/page.tsx'), renderExtensionRoute({ ...route('', 'list.tsx'), implementation: 'src/extensions/demo/routes/list.tsx' }));
  assert.match(await read('src/packages/index.ts'), /import package0 from "@\/extensions\/demo\/registry";/);
  assert.equal(await exists('src/extensions/demo/plextype.package.json'), false);
  assert.deepEqual((await lib.listAdoptedPackages(root)).map(item => [item.packageId, item.version]), [['demo', '0.6.0']]);
  // 가져온 시점의 사본은 고치기 전의 경로 그대로 남는다.
  assert.equal(await read(`${adopted.referencePath}/index.ts`), 'export { helper } from "@/packages/demo/helper";\n');

  // 새 버전이 나와도 설치하지 않는다. 비교용으로만 받는다.
  state.current = newer;
  await rejects(lib.installStorePackage(root, 'product-demo'), /내 확장으로 가져온 패키지라 설치하지 않습니다/);
  assert.equal(await exists('src/packages/demo'), false);
  const reference = await lib.downloadReferencePackage(root, 'product-demo');
  assert.deepEqual([reference.version, reference.basePath], ['0.7.0', adopted.referencePath]);
  assert.equal(await read(`${reference.referencePath}/index.ts`), 'export const next = true;\n');
  assert.equal(await read('src/extensions/demo/index.ts'), 'export { helper } from "@/extensions/demo/helper";\n');

  await rejects(lib.markAdoptedVersion(root, 'demo', 'latest'), /형식/);
  await lib.markAdoptedVersion(root, 'demo', '0.7.0');
  assert.equal((await lib.readAdopted(root, 'demo')).version, '0.7.0');

  // 가져오기를 취소하면 폴더가 백업으로 가고, 다시 설치할 수 있다.
  const discarded = await lib.discardAdoptedPackage(root, 'demo');
  assert.equal(await exists('src/extensions/demo'), false);
  assert.equal(await exists('src/app/(extensions)/demo/page.tsx'), false);
  assert.equal(await exists(`${discarded.backupPath}/helper.ts`), true);
  assert.doesNotMatch(await read('src/packages/index.ts'), /demo/);
  assert.equal((await lib.installStorePackage(root, 'product-demo')).version, '0.7.0');
});

test('an adopted package counts as installed for packages that need it, at the version it follows', async t => {
  const core = named('core', '1.0.0');
  const needsOld = named('app', '1.0.0', { requires: { packages: [{ packageId: 'core', minVersion: '1.0.0' }] } });
  const { root, state, exists } = await setupStore(t, [core, needsOld]);
  await lib.installStorePackage(root, 'product-core');
  await lib.adoptStorePackage(root, 'core');

  const preview = await lib.previewStorePackage(root, 'product-app');
  assert.deepEqual([preview.blockers, preview.alsoInstalls], [[], []]);
  await lib.installStorePackage(root, 'product-app');
  assert.equal(await exists('src/packages/core'), false);
  await lib.uninstallStorePackage(root, 'app');

  // 가져온 확장이 따르는 버전보다 높은 버전이 필요하면, 덮어쓰지 않고 직접 반영하라고 알린다.
  state.packages = [named('core', '2.0.0'), named('app', '2.0.0', { requires: { packages: [{ packageId: 'core', minVersion: '2.0.0' }] } })];
  const blocked = await lib.previewStorePackage(root, 'product-app');
  assert.match(blocked.blockers[0], /내 확장으로 가져온 core은\(는\) 1\.0\.0 기준/);
  await lib.markAdoptedVersion(root, 'core', '2.0.0');
  assert.deepEqual((await lib.previewStorePackage(root, 'product-app')).blockers, []);
});
