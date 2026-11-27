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

test('removes installed packages with their adapters and resets the package lists', t => {
  const { root, write } = fixture(t);
  const header = '// Extension-owned implementation; keep route configuration statically visible.\n';
  write('src/app/(modules)/auth/social-login/page.tsx', `${header}export { default } from "@/packages/social-login/routes/auth/social-login/page";\n`);
  write('src/app/(modules)/admin/installer/page.tsx', 'export { default } from "@/modules/installer";');
  write('src/packages/README.md', '# 설치한 패키지\n');
  write('src/packages/social-login/registry.tsx', 'export default {};');
  write('src/packages/index.ts', 'import package0 from "./social-login/registry";\nexport const installedPackages = [package0];\n');
  write('src/packages/installedTriggers.ts', 'import package0 from "@/extensions/adopted/triggers";\nexport const installedTriggers = [package0];\n');
  preparePlextype(root);
  assert.ok(!fs.existsSync(path.join(root, 'src/packages/social-login')));
  assert.ok(!fs.existsSync(path.join(root, 'src/app/(modules)/auth/social-login/page.tsx')));
  assert.ok(fs.existsSync(path.join(root, 'src/app/(modules)/admin/installer/page.tsx')));
  assert.ok(fs.existsSync(path.join(root, 'src/packages/README.md')));
  for (const [name, exported] of [['index.ts', 'installedPackages'], ['installedTriggers.ts', 'installedTriggers'], ['installedLoginProviders.ts', 'installedLoginProviders'], ['installedSocialProviders.ts', 'installedSocialProviders']]) {
    const content = fs.readFileSync(path.join(root, 'src/packages', name), 'utf8');
    assert.match(content, new RegExp(`export const ${exported}: \\w+(\\[\\])+ = \\[\\];`));
    assert.doesNotMatch(content, /import package/);
  }
});

test('package manifest is left byte-for-byte intact, including version and workspaces', t => {
  const { root, write } = fixture(t);
  write('src/app/page.tsx', 'export default function Page() { return null; }');
  const pkg = '{"name":"plextype","version":"0.1.0","workspaces":["src/extensions"],"dependencies":{"shared":"^1.0.0"}}\n';
  write('package.json', pkg);
  preparePlextype(root);
  assert.equal(fs.readFileSync(path.join(root, 'package.json'), 'utf8'), pkg);
});

test('a checkout without the extensions workspace still locks and installs with npm ci offline', t => {
  const { root, write } = fixture(t);
  write('src/app/page.tsx', 'export default function Page() { return null; }');
  write('fixtures/shared/package.json', JSON.stringify({ name: 'shared', version: '1.0.0' }));
  write('package.json', JSON.stringify({ name: 'plextype', version: '0.1.0', workspaces: ['src/extensions'],
    dependencies: { shared: 'file:fixtures/shared' } }));
  const env = { ...process.env, npm_config_cache: path.join(root, 'npm-cache') };
  const npm = args => {
    const result = spawnSync('npm', [...args, '--offline', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: root, env, encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
  };
  preparePlextype(root);
  npm(['install', '--package-lock-only']);
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  assert.deepEqual(lock.packages[''].dependencies, { shared: 'file:fixtures/shared' });
  npm(['ci']);
});
