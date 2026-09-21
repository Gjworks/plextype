import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(file, imports) {
  const source = fs.readFileSync(new URL(`../src/modules/user/actions/${file}`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', compiled)(name => {
    if (name in imports) return imports[name];
    if (name === 'node:crypto' || name === 'zod') return require(name);
    throw new Error(`Unexpected dependency: ${name}`);
  }, exports);
  return exports;
}

function setup(status = 'active') {
  const calls = { lookup: [], tokens: [], mails: [], cleanup: 0 };
  const query = load('recovery.query.ts', {
    '@utils/db/prisma': {
      $queryRaw: async (strings, accountId, email) => {
        assert.match(strings.join('?'), /WHERE LOWER\("accountId"\) = LOWER\(\?\)\s+AND LOWER\("email_address"\) = LOWER\(\?\)/);
        calls.lookup.push([accountId, email]);
        return accountId.toLowerCase() === 'member' && email.toLowerCase() === 'member@example.com'
          ? [{ id: 7, accountId: 'member', email_address: 'member@example.com', nickName: 'Member', status }] : [];
      },
    },
  });
  const action = load('recovery.action.ts', {
    './recovery.query': {
      ...query,
      deleteExpiredPasswordResetTokens: async () => { calls.cleanup++; },
      createPasswordResetToken: async (...args) => { calls.tokens.push(args); },
      findPublicSiteUrl: async () => 'https://example.com',
    },
    '@utils/auth/password': {},
    '@/core/utils/mail/smtp': { sendMail: async mail => { calls.mails.push(mail); } },
    '@/modules/admin/actions/auth-settings': {},
  });
  return {
    calls,
    request: fields => {
      const form = new FormData();
      for (const [key, value] of Object.entries(fields)) form.set(key, value);
      return action.requestPasswordResetAction(form);
    },
  };
}

test('requires both fields and rejects legacy single-field requests without DB writes', async () => {
  for (const fields of [{}, { account: 'member' }, { accountId: 'member' }, { email: 'member@example.com' }, { accountId: 'member', email: 'invalid' }]) {
    const { request, calls } = setup();
    assert.equal((await request(fields)).success, false);
    assert.equal(calls.lookup.length + calls.tokens.length + calls.mails.length + calls.cleanup, 0);
  }
});

test('only a matching active account receives a reset token and mail; responses do not disclose matches', async () => {
  const matched = setup();
  const response = await matched.request({ accountId: ' Member ', email: ' MEMBER@example.com ' });
  assert.equal(response.success, true);
  assert.deepEqual(matched.calls.lookup, [['Member', 'MEMBER@example.com']]);
  assert.equal(matched.calls.tokens.length, 1);
  assert.equal(matched.calls.tokens[0][0], 7);
  assert.match(matched.calls.tokens[0][1], /^[a-f0-9]{64}$/);
  assert.equal(matched.calls.mails[0].to, 'member@example.com');
  for (const [accountId, email, status] of [
    ['member', 'other@example.com', 'active'],
    ['other', 'member@example.com', 'active'],
    ['unknown', 'unknown@example.com', 'active'],
    ['member', 'member@example.com', 'inactive'],
  ]) {
    const instance = setup(status);
    assert.deepEqual(await instance.request({ accountId, email }), response);
    assert.equal(instance.calls.tokens.length + instance.calls.mails.length + instance.calls.cleanup, 0);
  }
});
