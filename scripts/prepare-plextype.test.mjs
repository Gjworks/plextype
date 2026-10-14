import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { preparePlextype } from './prepare-plextype.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plextype-prepare-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, text) => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  };
  write('scripts/plextype-distribution.json', JSON.stringify({ gjworksOnly: {} }));
  write('package.json', JSON.stringify({ name: 'plextype', version: '1.0.0', dependencies: {}, devDependencies: {} }));
  return { root, write };
}

test('refuses to modify an unfiltered source checkout', t => {
  const { root, write } = fixture(t);
  write('src/extensions/index.tsx', '');
  assert.throws(() => preparePlextype(root), /distribution checkout/);
});

test('removes only extension adapters, restores core pages and is idempotent', t => {
  const { root, write } = fixture(t);
  const adapter = '// Extension-owned implementation; keep route configuration statically visible.\nexport { default } from "@/extensions/example/page";\n';
  write('src/app/page.tsx', adapter);
  write('src/app/(modules)/user/notifications/page.tsx', adapter);
  write('src/app/(modules)/admin/store/page.tsx', adapter.replace('// Extension-owned implementation;', '// Implementation is owned by Store;'));
  write('src/app/(modules)/admin/installer/page.tsx', 'export { default } from "@/modules/installer";');
  write('src/app/api/custom/route.ts', 'export { GET } from "@/extensions/custom/api";');
  assert.equal(preparePlextype(root).length, 3);
  assert.match(fs.readFileSync(path.join(root, 'src/app/page.tsx'), 'utf8'), /DefaultLayout/);
  assert.ok(fs.existsSync(path.join(root, 'src/app/(modules)/user/notifications/page.tsx')));
  assert.ok(fs.existsSync(path.join(root, 'src/app/(modules)/admin/installer/page.tsx')));
  assert.ok(fs.existsSync(path.join(root, 'src/app/api/custom/route.ts')));
  assert.equal(preparePlextype(root).length, 0);
});

test('empty exclusions preserve the current package manifest and lockfile byte-for-byte', t => {
  const { root, write } = fixture(t);
  write('src/app/page.tsx', 'export default function Page() { return null; }');
  const pkg = '{"name":"plextype","version":"0.10.0","dependencies":{"shared":"^1.0.0","site-sdk":"^2.0.0"}}\n';
  const lock = '{"lockfileVersion":3,"packages":{}}\n';
  write('package.json', pkg);
  write('package-lock.json', lock);
  preparePlextype(root);
  assert.equal(fs.readFileSync(path.join(root, 'package.json'), 'utf8'), pkg);
  assert.equal(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'), lock);
});

test('feature exclusions remove only listed direct dependencies and retain version, scripts and overrides', t => {
  const { root, write } = fixture(t);
  write('src/app/page.tsx', 'export default function Page() { return null; }');
  const pkg = { name: 'plextype', version: '0.10.0', scripts: { build: 'next build' },
    dependencies: { shared: '^1.0.0', 'site-sdk': '^2.0.0', '@site/payments': '^3.0.0' },
    devDependencies: { typescript: '^5.0.0', '@types/site-sdk': '^1.0.0' },
    overrides: { shared: '$shared' } };
  write('package.json', JSON.stringify(pkg));
  write('scripts/plextype-distribution.json', JSON.stringify({ gjworksOnly: {
    store: { dependencies: ['site-sdk', '@site/payments'], devDependencies: ['@types/site-sdk'] },
    another: { dependencies: ['site-sdk', 'already-removed'] },
  } }));
  preparePlextype(root);
  const result = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.deepEqual(result, { ...pkg, dependencies: { shared: '^1.0.0' }, devDependencies: { typescript: '^5.0.0' } });
  const first = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
  preparePlextype(root);
  assert.equal(fs.readFileSync(path.join(root, 'package.json'), 'utf8'), first);
});

test('source checkout protection applies before any dependency removal', t => {
  const { root, write } = fixture(t);
  write('src/extensions/index.tsx', '');
  write('package.json', '{"dependencies":{"site-sdk":"^1.0.0"}}');
  write('scripts/plextype-distribution.json', JSON.stringify({ gjworksOnly: { site: { dependencies: ['site-sdk'] } } }));
  const before = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
  assert.throws(() => preparePlextype(root), /distribution checkout/);
  assert.equal(fs.readFileSync(path.join(root, 'package.json'), 'utf8'), before);
});

test('invalid exclusion configuration fails before modifying the manifest or routes', t => {
  const { root, write } = fixture(t);
  const adapter = '// Extension-owned implementation;\nexport { default } from "@/extensions/example/page";';
  write('src/app/page.tsx', adapter);
  const before = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
  for (const invalid of [
    { gjworksOnly: [] }, { gjworksOnly: { site: { dependency: ['site-sdk'] } } },
    { gjworksOnly: { site: { dependencies: 'site-sdk' } } },
    { gjworksOnly: { site: { dependencies: ['../unsafe'] } } },
    { gjworksOnly: { site: { dependencies: [null] } } },
    { gjworksOnly: {}, unknownOption: true },
  ]) {
    write('scripts/plextype-distribution.json', JSON.stringify(invalid));
    assert.throws(() => preparePlextype(root), /Invalid|must contain/);
    assert.equal(fs.readFileSync(path.join(root, 'package.json'), 'utf8'), before);
    assert.equal(fs.readFileSync(path.join(root, 'src/app/page.tsx'), 'utf8'), adapter);
  }
});

test('filtered manifest produces a consistent lockfile and passes npm ci without network access', t => {
  const { root, write } = fixture(t);
  write('src/app/page.tsx', 'export default function Page() { return null; }');
  write('fixtures/shared/package.json', JSON.stringify({ name: 'shared', version: '1.0.0' }));
  write('fixtures/site-sdk/package.json', JSON.stringify({ name: 'site-sdk', version: '1.0.0' }));
  write('package.json', JSON.stringify({ name: 'plextype', version: '1.0.0',
    dependencies: { shared: 'file:fixtures/shared', 'site-sdk': 'file:fixtures/site-sdk' } }));
  const env = { ...process.env, npm_config_cache: path.join(root, 'npm-cache') };
  const npm = args => {
    const result = spawnSync('npm', [...args, '--offline', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: root, env, encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
  };
  npm(['install', '--package-lock-only']);
  write('scripts/plextype-distribution.json', JSON.stringify({ gjworksOnly: { site: { dependencies: ['site-sdk'] } } }));
  preparePlextype(root);
  npm(['install', '--package-lock-only']);
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  assert.deepEqual(lock.packages[''].dependencies, { shared: 'file:fixtures/shared' });
  assert.equal(lock.packages['node_modules/site-sdk'], undefined);
  npm(['ci']);
});
