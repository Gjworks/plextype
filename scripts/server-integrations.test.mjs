import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

function load(file, imports = {}) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', compiled)(name => {
    if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
    return imports[name];
  }, exports);
  return exports;
}

test('core fallback works without Store or hosting schemas', async () => {
  const api = load('src/core/registry/defaultServerIntegrations.ts');
  assert.equal(await api.isProtectedUpload('/storage/uploads/image.png'), false);
  assert.deepEqual(await api.getMobileHostingData(7), { hostingRequests: [], hostingLogs: [] });
});

test('Store protection remains fail-closed and hosting lookup remains user-scoped', async () => {
  let unavailable = false;
  const api = load('src/extensions/serverIntegrations.ts', {
    './store/actions/market.query': {
      findStoreProductVersionByFilePath: async file => {
        if (unavailable) throw new Error('DB unavailable');
        return file.endsWith('.zip') ? { id: 1 } : null;
      },
    },
    './service/actions/deploy.query': {
      findServiceDeployRequestsByRequestedUserId: async (id, limit) => {
        assert.equal(id, 7); assert.equal(limit, 3); return [];
      },
      findServiceDeployLogsByRequestedUserId: async (id, limit) => {
        assert.equal(id, 7); assert.equal(limit, 5); return [];
      },
    },
  });
  assert.equal(await api.isProtectedUpload('/storage/uploads/package.zip'), true);
  assert.equal(await api.isProtectedUpload('/storage/uploads/image.png'), false);
  unavailable = true;
  await assert.rejects(api.isProtectedUpload('/storage/uploads/package.zip'), /DB unavailable/);
  assert.deepEqual(await api.getMobileHostingData(7), { hostingRequests: [], hostingLogs: [] });
});
