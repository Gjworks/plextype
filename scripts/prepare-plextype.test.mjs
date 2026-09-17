import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { preparePlextype } from './prepare-plextype.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plextype-prepare-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, text) => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  };
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
