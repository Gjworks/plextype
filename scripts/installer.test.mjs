import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
function load(file, overrides = {}) {
  const output = ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const api = {};
  new Function('require', 'exports', output)(name => overrides[name] ?? require(name), api);
  return api;
}
const inventory = load('../src/modules/installer/actions/inventory.query.ts');
const template = load('../src/modules/admin/components/AdminPageTemplate.tsx', {
  'next/link': ({ href, ...props }) => React.createElement('a', { href, ...props }),
});
const manifest = {
  schemaVersion: 1, type: 'plextype-extension', packageId: 'demo', version: '0.1.0',
  productUuid: 'product-test', installPath: 'src/extensions/demo', minPlatformVersion: '0.9.3',
  maxPlatformVersion: null, requiresDatabaseReview: true,
};

test('manifest identity and paths are validated; inventory never implies signature verification', () => {
  assert.equal(inventory.parseInstalledManifest(manifest, 'demo').verification, 'unverified');
  for (const change of [{ packageId: '../demo' }, { installPath: '/tmp/demo' }, { version: 'x' }, { type: 'download' }, { schemaVersion: 2 }, { requiresDatabaseReview: 'true' }]) {
    assert.equal(inventory.parseInstalledManifest({ ...manifest, ...change }, 'demo'), null);
  }
});

test('reads packages only, skips symlinks, reports invalid metadata and leaves files unchanged', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'installer-test-'));
  const extensions = path.join(root, 'src/extensions');
  try {
    assert.deepEqual(await inventory.readInstallerInventory(root), { packages: [], warnings: [] });
    for (const folder of ['demo', 'ordinary', 'broken', 'linked-file']) await fs.mkdir(path.join(extensions, folder), { recursive: true });
    const file = path.join(extensions, 'demo/plextype.package.json');
    const original = JSON.stringify(manifest);
    await fs.writeFile(file, original);
    await fs.writeFile(path.join(extensions, 'broken/plextype.package.json'), '{broken');
    await fs.symlink(path.join(extensions, 'demo'), path.join(extensions, 'linked-folder'));
    await fs.symlink(file, path.join(extensions, 'linked-file/plextype.package.json'));
    const result = await inventory.readInstallerInventory(root);
    assert.deepEqual(result.packages.map(item => item.packageId), ['demo']);
    assert.equal(result.warnings.length, 2);
    assert.equal(await fs.readFile(file, 'utf8'), original);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('admin action checks authorization before touching the filesystem and hides raw errors', async () => {
  let authorized = false;
  let calls = 0;
  let fail = false;
  const actions = load('../src/modules/installer/actions/installer.action.ts', {
    '@/modules/user/actions/user.action': { getUserSessionAction: async () => ({ success: true, data: { isAdmin: authorized } }) },
    './inventory.query': { readInstallerInventory: async () => { calls++; if (fail) throw Error('/private/secret'); return { packages: [], warnings: [] }; } },
  });
  assert.equal((await actions.getInstallerOverviewAdminAction()).success, false);
  assert.equal(calls, 0);
  authorized = true;
  const result = await actions.getInstallerOverviewAdminAction();
  assert.equal(result.success, true);
  assert.equal(result.data.storeConnected, false);
  assert.equal(calls, 1);
  fail = true;
  const failure = await actions.getInstallerOverviewAdminAction();
  assert.equal(failure.success, false);
  assert.doesNotMatch(failure.message, /secret/);
});

test('module is registered in core and does not import Store implementation', () => {
  assert.match(read('../src/core/registry/coreRegistry.tsx'), /installerModule,/);
  assert.match(read('../src/modules/installer/registry.tsx'), /label: "쉬운 설치"/);
  assert.match(read('../src/app/(modules)/admin/installer/page.tsx'), /@\/modules\/installer/);
  for (const file of ['index.tsx', 'registry.tsx', 'actions/installer.action.ts', 'actions/inventory.query.ts', 'tpl/InstallerAdmin.tsx']) {
    assert.doesNotMatch(read(`../src/modules/installer/${file}`), /from ["']@\/?extensions|child_process/);
  }
});

test('all views render honest disconnected states and package details', () => {
  const { default: Page } = load('../src/modules/installer/tpl/InstallerAdmin.tsx', {
    '@/modules/admin/components/AdminPageTemplate': template,
    'next/navigation': { useRouter: () => ({ refresh() {} }) },
    'next/link': ({ href, ...props }) => React.createElement('a', { href, ...props }),
  });
  const state = { success: true, message: '', data: { packages: [inventory.parseInstalledManifest(manifest, 'demo')], warnings: [], environment: 'development', storeConnected: false } };
  for (const view of ['catalog', 'purchases', 'installed', 'connection']) {
    const html = renderToStaticMarkup(React.createElement(Page, { state, view }));
    assert.match(html, /쉬운 설치/);
    assert.match(html, /아직 지원하지 않음/);
    if (view === 'installed') {
      assert.match(html, /src\/extensions\/demo/);
      assert.match(html, /서명 미검증/);
      assert.match(html, /0.1.0/);
    }
  }
  const denied = renderToStaticMarkup(React.createElement(Page, { state: { success: false, message: '관리자 권한이 필요합니다.' }, view: 'installed' }));
  assert.match(denied, /관리자 권한/);
  assert.doesNotMatch(denied, /src\/extensions\/demo/);
});

test('installer owns its tabs and provides constrained content spacing inside the admin shell', () => {
  const layout = read('../src/extensions/layouts/admin/AdminLayout.tsx');
  assert.match(layout, /const isDetachedInstallerSection = normalizedPathname === '\/admin\/installer' \|\| normalizedPathname.startsWith\('\/admin\/installer\/'\)/);
  assert.match(layout, /const isDetachedExtensionSection = .*isDetachedInstallerSection/);
  const page = read('../src/modules/installer/tpl/InstallerAdmin.tsx');
  assert.match(page, /<AdminPage/);
  assert.match(page, /<AdminPanel/);
  const shared = read('../src/modules/admin/components/AdminPageTemplate.tsx');
  assert.match(shared, /max-w-screen-2xl px-3 pb-12/);
  assert.match(shared, /flex items-center gap-6 overflow-x-auto/);
  assert.match(page, /sm:grid-cols-\[180px_minmax\(0,1fr\)\]/);
});

test('existing extension pages retain the same shared admin template exports', () => {
  const compatibility = load('../src/extensions/admin/AdminExtensionTemplate.tsx', {
    '@/modules/admin/components/AdminPageTemplate': template,
  });
  assert.equal(compatibility.AdminExtensionPage, template.AdminPage);
  for (const name of ['AdminPanel', 'AdminEmptyState', 'AdminInfoList', 'AdminStatGrid', 'adminPrimaryButtonClass', 'adminGhostButtonClass', 'adminDarkButtonClass', 'adminInputClass', 'adminTextareaClass', 'adminDangerButtonClass']) {
    assert.equal(compatibility[name], template[name]);
  }
});
