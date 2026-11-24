// 코어 API 토큰의 발급·재발급·해제·검증을 메모리 DB로 확인한다.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/modules/user/actions/apiToken.query.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;

function setup() {
  const rows = [];
  const user = { nickName: '회원', accountId: 'member', status: 'active', isAdmin: false };
  const matches = (row, where) => Object.entries(where).every(([key, value]) => row[key] === value);
  const apiToken = {
    create: async ({ data }) => { rows.push({ id: rows.length + 1, revokedAt: null, lastUsedAt: null, createdAt: new Date(), ...data }); },
    findMany: async ({ where }) => rows.filter(row => matches(row, where)),
    findFirst: async ({ where }) => { const row = rows.find(item => matches(item, where)); return row ? { ...row, user } : null; },
    update: async ({ where, data }) => { Object.assign(rows.find(row => row.id === where.id), data); },
    updateMany: async ({ where, data }) => { const hit = rows.filter(row => matches(row, where)); hit.forEach(row => Object.assign(row, data)); return { count: hit.length }; },
  };
  const api = {};
  new Function('require', 'exports', compiled)(name => name === '@/core/utils/db/prisma' ? { __esModule: true, default: { apiToken } } : require(name), api);
  return { api, rows, user };
}

test('only the secret hash is stored, and a token works only for the scopes it was given', async () => {
  const { api, rows } = setup();
  const token = await api.createApiToken(7, '회사 홈페이지', ['store:download']);
  assert.match(token, /^pxt_[a-f0-9]{16}_[a-f0-9]{48}$/);
  assert.ok(!JSON.stringify(rows).includes(token.split('_')[2]));
  assert.deepEqual(await api.verifyApiToken(token, 'store:download'), { userId: 7, tokenName: '회사 홈페이지', accountName: '회원' });
  assert.equal(await api.verifyApiToken(token, 'admin:remote'), null);
  assert.equal(await api.verifyApiToken(token.slice(0, -1) + (token.endsWith('0') ? '1' : '0'), 'store:download'), null);
  assert.equal(await api.verifyApiToken('not-a-token', 'store:download'), null);
  await assert.rejects(api.createApiToken(7, 'x', []));
  await assert.rejects(api.createApiToken(7, 'x', ['Everything']));
});

test('reissuing cuts the old value at once; only the owner can reissue or revoke', async () => {
  const { api, rows } = setup();
  const first = await api.createApiToken(7, '설치용', ['store:download']);
  const tokenId = first.split('_')[1];
  assert.equal(await api.rotateApiToken(8, tokenId), null);
  assert.equal(await api.revokeApiToken(8, tokenId), false);
  const second = await api.rotateApiToken(7, tokenId);
  assert.equal(await api.verifyApiToken(first, 'store:download'), null);
  assert.equal((await api.verifyApiToken(second, 'store:download')).userId, 7);
  assert.equal(rows.length, 1);
  assert.equal(await api.revokeApiToken(7, second.split('_')[1]), true);
  assert.equal(await api.verifyApiToken(second, 'store:download'), null);
  assert.deepEqual(await api.findActiveApiTokensByUser(7), []);
});

test('a suspended member cannot use an existing token', async () => {
  const { api, user } = setup();
  const token = await api.createApiToken(7, '설치용', ['store:download']);
  user.status = 'suspended';
  assert.equal(await api.verifyApiToken(token, 'store:download'), null);
});

test('the account screen actions return the new list with the one-time token instead of re-rendering the page', async () => {
  const file = new URL('../src/extensions/service/actions/accessToken.action.ts', import.meta.url);
  const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const { api: tokens } = setup();
  const actions = {};
  new Function('require', 'exports', output)(name => {
    if (name.includes('user.action')) return { getUserSessionAction: async () => ({ success: true, data: { id: 7 } }) };
    if (name.includes('apiToken.query')) return tokens;
    if (name.includes('accessTokenScopes')) return { ACCESS_TOKEN_SCOPES: [{ scope: 'store:download' }] };
    // 화면을 다시 그리게 하면 방금 발급한 값을 보여 줄 화면 상태가 사라지므로, 이 액션은 next/cache를 쓰지 않는다.
    throw new Error(`Unexpected dependency: ${name}`);
  }, actions);

  const form = new FormData();
  form.set('name', '회사 홈페이지');
  assert.match((await actions.createMyAccessTokenAction(form)).message, /권한/);
  form.append('scopes', 'admin:remote');
  assert.equal((await actions.createMyAccessTokenAction(form)).success, false);
  form.append('scopes', 'store:download');
  const created = await actions.createMyAccessTokenAction(form);
  assert.match(created.token, /^pxt_/);
  assert.deepEqual(created.tokens.map(item => [item.name, item.scopes]), [['회사 홈페이지', ['store:download']]]);
  const rotated = await actions.rotateMyAccessTokenAction(created.tokens[0].tokenId);
  assert.notEqual(rotated.token, created.token);
  assert.equal(rotated.tokens.length, 1);
  assert.deepEqual((await actions.deleteMyAccessTokenAction(rotated.tokens[0].tokenId)).tokens, []);
});
