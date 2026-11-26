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
const template = load('../src/core/components/admin/AdminPageTemplate.tsx', {
  'next/link': ({ href, ...props }) => React.createElement('a', { href, ...props }),
});
const manifest = {
  schemaVersion: 1, type: 'plextype-extension', packageId: 'demo', version: '0.1.0',
  productUuid: 'product-test', installPath: 'src/packages/demo', minPlatformVersion: '0.9.3',
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
  const extensions = path.join(root, 'src/packages');
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
  let installs = 0;
  let uninstalls = 0;
  let applies = 0;
  let database = { applied: true, failedStep: null, output: '' };
  let source = false;
  let coreApplies = 0;
  let finishes = 0;
  let finish = { completed: true, ran: ['npm install', 'npm run prisma:generate'], remaining: [], output: '' };
  class InstallerError extends Error {}
  const actions = load('../src/modules/installer/actions/installer.action.ts', {
    '@/modules/user/actions/user.action': { getUserSessionAction: async () => ({ success: true, data: { isAdmin: authorized } }) },
    './inventory.query': { readInstallerInventory: async () => { calls++; if (fail) throw Error('/private/secret'); return { packages: [], warnings: [] }; } },
    'next/cache': { revalidatePath() {} },
    '../lib/storeInstall': {
      DEFAULT_STORE_URL: 'https://store.example', InstallerError,
      compareVersions: (a, b) => a.localeCompare(b, undefined, { numeric: true }),
      readConnection: async () => null, readPlatformVersion: async () => '0.11.2', fetchCatalog: async () => [], listAdoptedPackages: async () => [],
      installStorePackage: async () => { installs++; if (installs === 2) throw new InstallerError('먼저 Store에 연결해주세요.'); if (installs === 3) throw Error('/private/secret'); return { packageId: 'demo', version: '0.1.0', previousVersion: null, requiresDatabaseReview: true, registered: true, newMigrations: ['20260101000000_first'], alsoInstalled: [{ packageId: 'core', version: '1.0.0', previousVersion: null }] }; },
      uninstallStorePackage: async () => { uninstalls++; return { packageId: 'demo', version: '0.1.0', routes: [], backupPath: '.plextype/backup/demo', migrations: [] }; },
    },
    '../lib/coreUpdate': {
      isCoreSource: async () => source,
      fetchCoreReleases: async () => [{ version: '0.12.0', size: 1, releasedAt: '' }],
      previewCoreUpdate: async () => { throw new InstallerError('먼저 Store에 연결해주세요.'); },
      applyCoreUpdate: async () => { coreApplies++; if (coreApplies === 2) throw Error('/private/secret'); return { version: '0.12.0', previousVersion: '0.11.2', written: 3, removed: 1, backupPath: '.plextype/backup/core', keptConflicts: [], referencePath: null, dependencies: ['next'], migrations: [] }; },
      coreUpdateNextSteps: (result, { finished = false } = {}) => (finished ? ['서버 재시작'] : ['npm install']),
    },
    '../lib/applyDatabase': {
      applyPackageDatabase: async () => { applies++; return database; },
      finishCoreUpdate: async () => { finishes++; return finish; },
      syncPackageSchema: async () => true,
      describeDatabaseFailure: result => new InstallerError(`실패: ${result.output}`),
    },
  });
  assert.equal((await actions.getInstallerOverviewAdminAction()).success, false);
  assert.equal(calls, 0);
  authorized = true;
  const result = await actions.getInstallerOverviewAdminAction();
  assert.equal(result.success, true);
  assert.equal(result.data.storeConnected, false);
  assert.equal(calls, 1);
  // Store에 지금 버전보다 새 코어 배포본이 있으면 알리고, 원본 저장소에서는 Store에 묻지도 않는다.
  assert.deepEqual(result.data.core, { source: false, latestVersion: '0.12.0', updateAvailable: true, error: null });
  source = true;
  assert.deepEqual((await actions.getInstallerOverviewAdminAction()).data.core, { source: true, latestVersion: null, updateAvailable: false, error: null });
  source = false;
  fail = true;
  const failure = await actions.getInstallerOverviewAdminAction();
  assert.equal(failure.success, false);
  assert.doesNotMatch(failure.message, /secret/);

  authorized = false;
  assert.equal((await actions.installStorePackageAdminAction('product')).success, false);
  assert.equal(installs, 0);
  authorized = true;
  // 확인 없이 부르면 DB에는 손대지 않고, 적용할 명령을 알려 준다.
  assert.match((await actions.installStorePackageAdminAction('product')).message, /demo 0\.1\.0.*함께 설치: core 1\.0\.0.*등록했습니다.*npm run plextype -- migrate/);
  assert.equal(applies, 0);
  assert.match((await actions.installStorePackageAdminAction('product')).message, /먼저 Store에 연결/);
  const hidden = await actions.installStorePackageAdminAction('product');
  assert.equal(hidden.success, false);
  assert.doesNotMatch(hidden.message, /secret/);

  // 확인을 받아 부르면 DB에 적용한다. 스키마를 합치다 실패하면 새로 설치한 패키지는 다시 빼고, 마이그레이션 중 실패하면 그대로 둔다.
  assert.match((await actions.installStorePackageAdminAction('product', { applyDatabase: true })).message, /마이그레이션 1개를 DB에 적용/);
  assert.equal(applies, 1);
  database = { applied: false, failedStep: 'generate', output: '이름이 겹칩니다' };
  const reverted = await actions.installStorePackageAdminAction('product', { applyDatabase: true });
  assert.equal(reverted.success, false);
  assert.match(reverted.message, /이름이 겹칩니다[\s\S]*설치를 취소/);
  // 대상 패키지와, 함께 새로 설치한 패키지를 모두 뺀다.
  assert.equal(uninstalls, 2);
  database = { applied: false, failedStep: 'migrate', output: 'SQL 오류' };
  assert.match((await actions.installStorePackageAdminAction('product', { applyDatabase: true })).message, /SQL 오류[\s\S]*설치된 상태/);
  assert.equal(uninstalls, 2);

  // 코어 업데이트도 관리자만 부를 수 있고, 적용한 뒤 사람이 할 일을 함께 알린다.
  const options = { version: '0.12.0', sha256: 'a'.repeat(64) };
  authorized = false;
  assert.equal((await actions.previewCoreUpdateAdminAction()).success, false);
  assert.equal((await actions.applyCoreUpdateAdminAction(options)).success, false);
  assert.equal(coreApplies, 0);
  authorized = true;
  assert.match((await actions.previewCoreUpdateAdminAction()).message, /먼저 Store에 연결/);
  assert.match((await actions.applyCoreUpdateAdminAction(options)).message, /0\.11\.2에서 0\.12\.0으로[\s\S]*\.plextype\/backup\/core[\s\S]*다음 할 일\n- npm install/);
  assert.doesNotMatch((await actions.applyCoreUpdateAdminAction(options)).message, /secret/);
  // npm install과 DB 적용은 고른 경우에만 실행한다. 실패하면 파일이 새 버전으로 남았다는 것과 이어서 실행할 명령을 알린다.
  assert.equal(finishes, 0);
  const finished = await actions.applyCoreUpdateAdminAction({ ...options, finish: true });
  assert.equal(finishes, 1);
  assert.match(finished.message, /이어서 실행했습니다: npm install, npm run prisma:generate\.[\s\S]*다음 할 일\n- 서버 재시작/);
  assert.doesNotMatch(finished.message, /- npm install/);
  finish = { completed: false, ran: ['npm install'], remaining: ['npm run prisma:generate', 'npm run migrate:deploy'], output: '스키마 오류' };
  const stopped = await actions.applyCoreUpdateAdminAction({ ...options, finish: true });
  assert.equal(stopped.success, false);
  assert.match(stopped.message, /npm run prisma:generate 실행 중 실패[\s\S]*스키마 오류[\s\S]*0\.12\.0으로 바뀐 상태[\s\S]*npm run prisma:generate, npm run migrate:deploy/);
});

test('module is registered in core and does not import Store implementation', () => {
  assert.match(read('../src/core/registry/coreRegistry.tsx'), /installerModule,/);
  assert.match(read('../src/modules/installer/registry.tsx'), /label: "쉬운 설치"/);
  assert.match(read('../src/app/(modules)/admin/installer/page.tsx'), /@\/modules\/installer/);
  // 명령 실행은 DB 적용을 맡은 lib/applyDatabase.ts 한 곳에만 둔다. 그 파일은 프로젝트의 npm 스크립트만 실행한다.
  assert.doesNotMatch(read('../src/modules/installer/lib/applyDatabase.ts').replace(/^\/\/.*$/gm, ''), /exec\(|execSync|shell:\s*true/);
  // 실행하는 것은 npm뿐이고, 인자는 고정된 npm 스크립트 실행과 npm install 두 가지다.
  const commands = read('../src/modules/installer/lib/applyDatabase.ts');
  assert.deepEqual(commands.match(/spawn\([^)]*\)/g), ['spawn("npm", args, { cwd: root, env: process.env, stdio: ["ignore", "pipe", "pipe"] })']);
  assert.deepEqual(commands.match(/\bnpm\(root, [^)]*\)/g), ['npm(root, ["run", "--silent", script], STEP_TIMEOUT)', 'npm(root, INSTALL_ARGS, INSTALL_TIMEOUT)']);
  assert.match(commands, /const INSTALL_ARGS = \["install", "--no-audit", "--no-fund"\];/);
  for (const file of ['index.tsx', 'registry.tsx', 'actions/installer.action.ts', 'actions/inventory.query.ts', 'tpl/InstallerAdmin.tsx', 'tpl/InstallerCorePanel.tsx', 'lib/storeInstall.ts', 'lib/coreUpdate.ts']) {
    // import 문만 본다. 설치기는 연결 파일이 가리키는 경로를 문자열로 비교하므로 본문에는 확장 경로가 나올 수 있다.
    assert.doesNotMatch(read(`../src/modules/installer/${file}`), /^\s*(import|export)\b[^;]*from ["']@\/?extensions|child_process/m);
  }
});

test('views show what can be done in the current connection and environment', () => {
  const corePanel = load('../src/modules/installer/tpl/InstallerCorePanel.tsx', {
    '@/core/components/admin/AdminPageTemplate': template,
    '../actions/installer.action': {},
  });
  const { default: Page } = load('../src/modules/installer/tpl/InstallerAdmin.tsx', {
    './InstallerCorePanel': corePanel,
    '@/core/components/admin/AdminPageTemplate': template,
    'next/navigation': { useRouter: () => ({ refresh() {} }) },
    'next/link': ({ href, ...props }) => React.createElement('a', { href, ...props }),
    '../actions/installer.action': {},
  });
  const item = { productUuid: 'product-test', name: 'Demo 자료', summary: '', category: 'layout', licenseType: 'mit', sellerName: '판매자', packageId: 'demo', version: '0.2.0', minPlatformVersion: '0.9.3', maxPlatformVersion: null, requiresDatabaseReview: false, size: 2048, securityVersions: ['0.1.5'] };
  const base = { packages: [inventory.parseInstalledManifest(manifest, 'demo')], warnings: [], adopted: [], platformVersion: '0.11.2', defaultStoreUrl: 'https://store.example', catalog: [item, { ...item, productUuid: 'future', packageId: 'future', minPlatformVersion: '9.0.0' }], catalogError: null, core: { source: false, latestVersion: '0.12.0', updateAvailable: true, error: null } };
  const render = (data, view) => renderToStaticMarkup(React.createElement(Page, { state: { success: true, message: '', data: { ...base, ...data } }, view }));
  const disconnected = { environment: 'development', storeConnected: false, connection: null };
  const connected = { environment: 'development', storeConnected: true, connection: { storeUrl: 'https://store.example', accountName: '계정', tokenName: '프로젝트', keyCount: 1, connectedAt: '' } };

  for (const view of ['catalog', 'installed', 'core', 'connection']) assert.match(render(disconnected, view), /쉬운 설치/);
  const installed = render(disconnected, 'installed');
  assert.match(installed, /src\/packages\/demo/);
  assert.match(installed, /서명 미검증/);
  assert.match(installed, /0.1.0/);

  const buttons = html => [...html.matchAll(/<button([^>]*)>(.*?)<\/button>/gs)].map(([, attributes, body]) => ({ disabled: /\sdisabled(=|\s|$)/.test(attributes), text: body.replace(/<[^>]+>/g, '') }));
  const enabled = html => buttons(html).filter(button => !button.disabled).map(button => button.text);
  const disabled = html => buttons(html).filter(button => button.disabled).map(button => button.text);

  // 연결 전에는 설치 버튼이 모두 잠기고, 연결 화면은 토큰을 받는다.
  assert.deepEqual(disabled(render(disconnected, 'catalog')), ['업데이트', '호환 안 됨']);
  assert.match(render(disconnected, 'connection'), /name="token"/);
  // 연결하면 설치된 것보다 새 버전은 업데이트로 열리고, 맞지 않는 Plextype 버전용은 잠긴 채로 남는다.
  const catalog = render(connected, 'catalog');
  assert.match(catalog, /설치됨 0\.1\.0/);
  assert.ok(enabled(catalog).includes('업데이트'));
  assert.deepEqual(disabled(catalog), ['호환 안 됨']);
  assert.doesNotMatch(render(connected, 'connection'), /name="token"/);
  assert.ok(enabled(render(connected, 'connection')).includes('연결 해제'));
  assert.ok(enabled(render(connected, 'installed')).includes('제거'));
  // 설치된 버전(0.1.0)보다 새로운 보안 패치(0.1.5)가 있으면 어느 탭에서든 알린다.
  for (const view of ['catalog', 'installed', 'connection']) assert.match(render(connected, view), /보안 패치가 나온 패키지가 있습니다[\s\S]*지금 0\.1\.0, 보안 패치 0\.1\.5/);
  assert.ok(enabled(render(connected, 'installed')).includes('내 확장으로 가져오기'));
  // 내 확장으로 가져온 패키지는 설치·업데이트 대신 새 버전을 받아 두는 버튼만 내놓고, 보안 패치는 직접 반영하라고 알린다.
  const adoptedState = { ...connected, packages: [], adopted: [{ packageId: 'demo', productUuid: 'product-test', version: '0.1.0', path: 'src/extensions/demo', adoptedAt: '' }] };
  const adoptedCatalog = render(adoptedState, 'catalog');
  assert.match(adoptedCatalog, /내 확장으로 가져옴 · 0\.1\.0 기준/);
  assert.match(adoptedCatalog, /자동으로 받을 수 없습니다/);
  assert.ok(enabled(adoptedCatalog).includes('새 버전 받아 두기'));
  assert.ok(!buttons(adoptedCatalog).some(button => button.text === '업데이트' || button.text === '설치'));
  assert.ok(enabled(render(adoptedState, 'installed')).includes('가져오기 취소'));
  // 운영 환경에서는 연결돼 있어도 설치·연결·제거를 내놓지 않는다.
  const production = { ...connected, environment: 'production' };
  assert.deepEqual(disabled(render(production, 'catalog')), ['업데이트', '호환 안 됨']);
  assert.doesNotMatch(render(production, 'connection'), /연결 해제|name="token"/);
  assert.ok(!buttons(render(production, 'installed')).some(button => button.text === '제거'));
  // 코어 업데이트는 연결된 개발 환경에서 새 버전이 있을 때만 열리고, 코어의 원본 저장소에서는 버튼을 내놓지 않는다.
  assert.match(render(connected, 'core'), /새 버전 0\.12\.0/);
  assert.ok(enabled(render(connected, 'core')).includes('바뀌는 내용 확인'));
  for (const state of [disconnected, production, { ...connected, core: { source: false, latestVersion: '0.11.2', updateAvailable: false, error: null } }]) {
    assert.ok(disabled(render(state, 'core')).includes('바뀌는 내용 확인'));
  }
  const sourceCore = render({ ...connected, core: { source: true, latestVersion: null, updateAvailable: false, error: null } }, 'core');
  assert.match(sourceCore, /코어의 원본 저장소/);
  assert.ok(!buttons(sourceCore).some(button => button.text === '바뀌는 내용 확인'));
  const denied = renderToStaticMarkup(React.createElement(Page, { state: { success: false, message: '관리자 권한이 필요합니다.' }, view: 'installed' }));
  assert.match(denied, /관리자 권한/);
  assert.doesNotMatch(denied, /src\/packages\/demo/);
});

test('installer owns its tabs and provides constrained content spacing inside the admin shell', () => {
  const layout = read('../src/extensions/layouts/admin/AdminLayout.tsx');
  assert.match(layout, /const isDetachedInstallerSection = normalizedPathname === '\/admin\/installer' \|\| normalizedPathname.startsWith\('\/admin\/installer\/'\)/);
  assert.match(layout, /const isDetachedExtensionSection = .*isDetachedInstallerSection/);
  const page = read('../src/modules/installer/tpl/InstallerAdmin.tsx');
  assert.match(page, /<AdminPage/);
  assert.match(page, /<AdminPanel/);
  const shared = read('../src/core/components/admin/AdminPageTemplate.tsx');
  assert.match(shared, /max-w-screen-2xl px-3 pb-12/);
  assert.match(shared, /flex items-center gap-6 overflow-x-auto/);
  assert.match(page, /sm:grid-cols-\[180px_minmax\(0,1fr\)\]/);
});

test('existing extension pages retain the same shared admin template exports', () => {
  const compatibility = load('../src/extensions/admin/AdminExtensionTemplate.tsx', {
    '@/core/components/admin/AdminPageTemplate': template,
  });
  assert.equal(compatibility.AdminExtensionPage, template.AdminPage);
  for (const name of ['AdminPanel', 'AdminEmptyState', 'AdminInfoList', 'AdminStatGrid', 'adminPrimaryButtonClass', 'adminGhostButtonClass', 'adminDarkButtonClass', 'adminInputClass', 'adminTextareaClass', 'adminDangerButtonClass']) {
    assert.equal(compatibility[name], template[name]);
  }
});
