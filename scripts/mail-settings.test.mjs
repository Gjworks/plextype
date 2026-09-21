import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(file, imports = {}) {
  const source = fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
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
const schema = load('modules/admin/mail-settings.ts');

test('SMTP settings validate addresses and TLS port combinations', () => {
  const settings = { mode: 'custom', host: 'smtp.example.com', port: 465, secure: true, user: 'help@example.com', from: 'help@example.com' };
  assert.equal(schema.mailSettingsSchema.safeParse(settings).success, true);
  for (const change of [{ host: 'host\r\n' + 'injected' }, { from: 'invalid' }, { port: 587 }, { user: '' }]) {
    assert.equal(schema.mailSettingsSchema.safeParse({ ...settings, ...change }).success, false);
  }
});

test('credentials are encrypted and authenticated; disabled mode never sends', async () => {
  const original = process.env.MAIL_ENCRYPTION_KEY;
  process.env.MAIL_ENCRYPTION_KEY = 'test-only-key-not-for-production-123456789';
  try {
    const helpers = load('core/utils/mail/settings.ts', {
      '@/modules/admin/mail-settings': schema,
      '@/modules/admin/actions/settings.query': { getSettingsByKeysQuery: async () => [{ key: 'mail.smtp', value: JSON.stringify({ ...schema.defaultMailSettings, mode: 'disabled' }) }] },
    });
    const encrypted = helpers.encryptMailPassword('smtp-secret');
    assert.equal(encrypted.includes('smtp-secret'), false);
    assert.equal(helpers.decryptMailPassword(encrypted), 'smtp-secret');
    const parts = encrypted.split(':');
    parts[2] = Buffer.alloc(16).toString('base64');
    assert.throws(() => helpers.decryptMailPassword(parts.join(':')));
    assert.equal(await helpers.getSmtpConfig(), null);
  } finally {
    if (original === undefined) delete process.env.MAIL_ENCRYPTION_KEY;
    else process.env.MAIL_ENCRYPTION_KEY = original;
  }
});

test('admin-only actions hide credentials and preserve settings when switching modes', async () => {
  let admin = false;
  let saved;
  const previous = { mode: 'custom', host: 'smtp.example.com', port: 465, secure: true, user: 'help@example.com', from: 'help@example.com' };
  const action = load('modules/admin/actions/mail-settings.action.ts', {
    'next/cache': { revalidatePath() {} },
    '@/modules/user/actions/user.action': { getUserSessionAction: async () => ({ data: { isAdmin: admin } }) },
    './settings.query': { upsertSettingsQuery: async seeds => { saved = seeds; } },
    '../mail-settings': schema,
    '@/core/utils/mail/settings': {
      readMailSettings: async () => ({ settings: previous, encryptedPassword: 'ciphertext' }),
      mailEncryptionReady: () => true, environmentSmtpConfig: () => null,
      encryptMailPassword: () => 'new-ciphertext', MAIL_SETTINGS_KEY: 'mail.smtp', MAIL_PASSWORD_KEY: 'mail.smtp.password',
    },
  });
  const form = new FormData();
  form.set('mode', 'disabled');
  assert.equal((await action.getMailSettingsAdminAction()).success, false);
  assert.equal((await action.updateMailSettingsAdminAction(form)).success, false);
  assert.equal(saved, undefined);
  admin = true;
  const view = await action.getMailSettingsAdminAction();
  assert.equal(view.data.passwordConfigured, true);
  assert.equal(JSON.stringify(view).includes('ciphertext'), false);
  assert.equal((await action.updateMailSettingsAdminAction(form)).success, true);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].isPublic, false);
  assert.deepEqual(JSON.parse(saved[0].value), { ...previous, mode: 'disabled' });
  for (const [key, value] of Object.entries({ ...previous, host: 'other.example.com' })) form.set(key, String(value));
  saved = undefined;
  assert.equal((await action.updateMailSettingsAdminAction(form)).success, false);
  assert.equal(saved, undefined);
});
