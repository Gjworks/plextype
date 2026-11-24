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

function buildPackage(version, sources, { keyId = 'test-key', min = '0.1.0' } = {}) {
  const files = Object.entries(sources).map(([name, text]) => [name, Buffer.from(text)]);
  const manifest = {
    schemaVersion: 1, type: 'plextype-extension', productUuid: 'product-demo', packageId: 'demo', version,
    minPlatformVersion: min, maxPlatformVersion: null, installPath: 'src/extensions/demo',
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

const route = (name, file) => ({ route: `src/app/(extensions)/demo/${name}page.tsx`, implementation: `src/extensions/demo/routes/${file}`, configs: ['export const dynamic = "force-dynamic";'] });
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
  await fs.mkdir(path.join(root, 'src/extensions'), { recursive: true });
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
  assert.equal(await read('src/extensions/demo/index.ts'), 'export const demo = 1;\n');
  assert.equal(JSON.parse(await read('src/extensions/demo/plextype.package.json')).version, '0.1.0');
  for (const entry of [route('', 'list.tsx'), route('[id]/', 'detail.tsx')]) {
    assert.equal(await read(entry.route), renderExtensionRoute(entry));
  }
  assert.equal(await exists('.plextype/tmp/demo'), false);
});

test('updating replaces the folder, drops routes the new version no longer has, and keeps a backup', async t => {
  const { root, storeUrl, state, exists, read } = await setup(t);
  await lib.connectStore(root, storeUrl, TOKEN);
  await lib.installStorePackage(root, 'product-demo');
  state.current = second;
  const result = await lib.installStorePackage(root, 'product-demo');
  assert.equal(result.previousVersion, '0.1.0');
  assert.equal(await read('src/extensions/demo/index.ts'), 'export const demo = 2;\n');
  assert.equal(await exists('src/extensions/demo/routes/detail.tsx'), false);
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
    ['a hand-written extension folder', async ctx => { await fs.mkdir(path.join(ctx.root, 'src/extensions/demo')); await fs.writeFile(path.join(ctx.root, 'src/extensions/demo/mine.ts'), 'mine'); }, /덮어쓰지 않습니다/],
    ['a hand-written route', async ctx => { await fs.mkdir(path.join(ctx.root, 'src/app/(extensions)/demo'), { recursive: true }); await fs.writeFile(path.join(ctx.root, 'src/app/(extensions)/demo/page.tsx'), 'export default 1;'); }, /덮어쓰지 않습니다/],
  ];
  for (const [name, arrange, pattern] of cases) {
    await t.test(name, async t => {
      const ctx = await setup(t);
      await lib.connectStore(ctx.root, ctx.storeUrl, TOKEN);
      await arrange(ctx);
      await rejects(lib.installStorePackage(ctx.root, 'product-demo'), pattern);
      assert.equal(await ctx.exists('src/extensions/demo/index.ts'), false);
      assert.equal(await ctx.exists('src/app/(extensions)/demo/[id]/page.tsx'), false);
    });
  }
});

test('removing moves the folder to the backup area and deletes only its own adapters', async t => {
  const { root, storeUrl, exists } = await setup(t);
  await lib.connectStore(root, storeUrl, TOKEN);
  await fs.mkdir(path.join(root, 'src/extensions/mine'));
  await rejects(lib.uninstallStorePackage(root, 'mine'), /쉬운 설치로 넣은 패키지가 아니어서/);
  await lib.installStorePackage(root, 'product-demo');
  const result = await lib.uninstallStorePackage(root, 'demo');
  assert.equal(result.routes.length, 2);
  assert.equal(await exists('src/extensions/demo'), false);
  assert.equal(await exists('src/app/(extensions)/demo/page.tsx'), false);
  assert.equal(await exists(`${result.backupPath}/index.ts`), true);
  assert.equal(await exists('src/extensions/mine'), true);
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
