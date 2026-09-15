import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { findExtensionPrismaSources, readExtensionRoutes, renderExtensionRoute } from './extension-files.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('all extension route adapters match their owning manifests', () => {
  const routes = readExtensionRoutes(root);
  assert.ok(routes.length > 26);
  for (const entry of routes) {
    assert.equal(fs.readFileSync(entry.routePath, 'utf8'), renderExtensionRoute(entry), entry.route);
  }
  const docs = routes.find(entry => entry.route === 'src/app/(extensions)/docs/[slug]/page.tsx');
  assert.ok(docs.exports.includes('generateStaticParams'));
  const notify = routes.find(entry => entry.route.endsWith('/service-deploy/notify/route.ts'));
  assert.deepEqual(notify.exports, ['POST']);
  const download = routes.find(entry => entry.route.endsWith('/store/orders/[uuid]/download/route.ts'));
  assert.ok(download.configs.includes('export const runtime = "nodejs";'));
});

test('schema discovery supports legacy and nested feature folders, without dependencies or symlinks', t => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'extension-schema-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  for (const folder of ['prisma', 'service/prisma', 'posts/issuetracker/prisma', 'node_modules/unrelated/prisma']) {
    fs.mkdirSync(path.join(fixture, 'src/extensions', folder), { recursive: true });
  }
  fs.symlinkSync(path.join(fixture, 'src/extensions/service'), path.join(fixture, 'src/extensions/alias'));
  const sources = findExtensionPrismaSources(fixture);
  assert.equal(sources.length, 3);
  assert.ok(sources.some(source => source.schemaDir.endsWith('posts/issuetracker/prisma/schema')));
});

test('route mapping refuses destinations outside app and implementations outside their owner', t => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'extension-routes-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const owner = path.join(fixture, 'src/extensions/sample');
  fs.mkdirSync(owner, { recursive: true });
  const manifest = path.join(owner, 'routes.json');
  fs.writeFileSync(manifest, JSON.stringify([{ route: '../outside.ts', implementation: 'src/extensions/sample/page.tsx' }]));
  assert.throws(() => readExtensionRoutes(fixture), /outside its owner/);
  fs.writeFileSync(manifest, JSON.stringify([{ route: 'src/app/page.tsx', implementation: 'src/extensions/other/page.tsx' }]));
  assert.throws(() => readExtensionRoutes(fixture), /outside its owner/);
});

test('route mapping rejects duplicate URL file ownership', t => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'extension-duplicate-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const owner = path.join(fixture, 'src/extensions/sample');
  fs.mkdirSync(owner, { recursive: true });
  fs.writeFileSync(path.join(owner, 'page.tsx'), 'export default function Page() {}');
  const entry = { route: 'src/app/page.tsx', implementation: 'src/extensions/sample/page.tsx', configs: [] };
  fs.writeFileSync(path.join(owner, 'routes.json'), JSON.stringify([entry, entry]));
  assert.throws(() => readExtensionRoutes(fixture), /Duplicate route/);
});
