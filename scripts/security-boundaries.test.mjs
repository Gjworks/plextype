import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import * as jose from 'jose';
import DOMPurify from 'isomorphic-dompurify';
const require = createRequire(import.meta.url);
const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
function load(file, mocks = {}) {
  const compiled = ts.transpileModule(source(file), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const exports = {};
  new Function('require', 'exports', compiled)(name => {
    if (name === 'server-only') return {};
    if (name in mocks) return mocks[name];
    if (name.startsWith('node:') || ['crypto', 'dayjs', 'nanoid'].includes(name)) return require(name);
    throw new Error(`Unexpected dependency: ${name}`);
  }, exports);
  return exports;
}
const quiet = async fn => {
  const original = console.error; console.error = () => {};
  try { return await fn(); } finally { console.error = original; }
};

test('nested user responses exclude both credential fields and preserve dates', () => {
  const { withoutCredentials } = load('src/core/utils/auth/safeUser.ts');
  const date = new Date();
  const result = withoutCredentials({ password: 'own', refreshToken: 'own', date,
    userGroups: [{ group: { users: [{ user: { id: 7, password: 'other', refreshToken: 'other' } }] } }] });
  assert.equal(result.date, date);
  assert.deepEqual(result.userGroups[0].group.users[0].user, { id: 7 });
  assert.ok(!JSON.stringify(result).includes('password'));
  assert.ok(!JSON.stringify(result).includes('refreshToken'));
});

test('session query never loads other group members', async () => {
  let args;
  const query = load('src/modules/user/actions/user.query.ts', {
    '@utils/db/prisma': { user: { findUnique: async value => { args = value; return null; } } },
  });
  await query.findUserSessionData('member');
  assert.deepEqual(args.include.userGroups, { include: { group: true } });
});

test('all category administrator mutations reject before reaching writes', async () => {
  let writes = 0;
  const api = load('src/modules/posts/actions/category.action.ts', {
    '@/core/utils/auth/requireAdmin': { requireAdmin: async () => { throw new Error('Forbidden'); } },
    'next/cache': {}, './category': new Proxy({}, { get: () => async () => { writes++; } }),
  });
  await quiet(async () => {
    for (const [name, args] of [
      ['getCategoriesAdminAction', [1]], ['addCategoryAdminAction', ['x', null, 1]],
      ['renameCategoryAdminAction', ['1', 'x']], ['removeCategoryAdminAction', ['1']],
      ['saveCategoryTreeAdminAction', [[]]],
    ]) assert.equal((await api[name](...args)).success, false);
  });
  assert.equal(writes, 0);
});

test('group mapping cannot be changed without administrator authority', async () => {
  let writes = 0;
  const api = load('src/modules/user/actions/group.action.ts', {
    '@/core/utils/auth/requireAdmin': { requireAdmin: async () => { throw new Error('Forbidden'); } },
    '@/modules/user/actions/user.action': {}, '@utils/validation/formValidator': {}, './_type': {},
    './group.query': { updateUserGroupQuery: async () => writes++, deleteUserGroupQuery: async () => writes++ },
  });
  await quiet(async () => {
    assert.equal((await api.updateUserGroup(7, [1])).success, false);
    assert.equal((await api.deleteUserGroup(7)).success, false);
  });
  assert.equal(writes, 0);
});

test('forced logout requires admin and rejects wildcard user identifiers', async () => {
  for (const path of ['src/widgets/admin/activeUser/activeUser.ts', 'src/modules/user/admin/widgets/activeUser/activeUser.ts']) {
    let admin = false, revoked = 0, reads = 0;
    const api = load(path, {
      '@/core/utils/auth/requireAdmin': { requireAdmin: async () => { if (!admin) throw new Error('Forbidden'); } },
      '@/core/utils/auth/jwtAuth': { revokeUserSessions: async () => revoked++ },
      '@core/utils/redis/redis': { keys: async () => { reads++; return []; } },
      '@/modules/notification/actions/notification.action': { dispatchNotificationAction: async () => {} },
    });
    await quiet(async () => {
      assert.equal((await api.forceLogout('7')).success, false);
      admin = true;
      assert.equal((await api.forceLogout('*')).success, false);
      assert.equal(reads, 0); assert.equal(revoked, 0);
      assert.equal((await api.forceLogout('7')).success, true);
      assert.equal(revoked, 1);
    });
  }
});

function authHarness() {
  process.env.JWT_SECRET = 'synthetic-regression-key-not-a-secret-000000';
  const store = new Map();
  let user = { id: 7, accountId: 'member', nickName: 'Member', password: 'synthetic-hash',
    refreshToken: null, status: 'active', isAdmin: false, userGroups: [{ groupId: 2 }] };
  const refresh = load('src/core/utils/auth/refreshToken.ts');
  const api = load('src/core/utils/auth/jwtAuth.ts', {
    jose,
    '@/core/utils/db/prisma': { user: { findUnique: async () => user, updateMany: async ({ data }) => { Object.assign(user, data); return { count: 1 }; } } },
    '@/core/utils/redis/redis': { get: async key => store.get(key) || null,
      set: async (key, value, mode) => { if (mode !== 'NX' || !store.has(key)) store.set(key, value); return 'OK'; } },
    './refreshToken': refresh,
    '@/core/utils/date/timeToSeconds': load('src/core/utils/date/timeToSeconds.ts'),
  });
  return { api, store, user, hash: refresh.hashRefreshToken };
}

test('access lifetime is capped and current DB permissions override JWT claims', async () => {
  const { api, user } = authHarness();
  const token = await api.sign({ id: 7, isAdmin: true, groups: [1] }, '365d');
  const raw = jose.decodeJwt(token);
  assert.equal(raw.exp - raw.iat, 3600);
  assert.equal((await api.verify(token)).isAdmin, false);
  assert.deepEqual((await api.verify(token)).groups, [2]);
  user.isAdmin = true;
  assert.equal((await api.verify(token)).isAdmin, true);
  user.status = 'blocked';
  assert.equal(await api.verify(token), null);
});

test('logout/force revoke rejects copied access and refresh tokens, including bearer use', async () => {
  const { api, user, hash } = authHarness();
  const payload = { id: 7, accountId: 'member' };
  const access = await api.sign(payload, '1h');
  const refresh = await api.refresh(payload, '30d');
  user.refreshToken = hash(refresh);
  assert.ok(await api.verify(access)); assert.ok(await api.refreshVerify(refresh));
  await api.revokeUserSessions(7);
  assert.equal(await api.verify(access), null); assert.equal(await api.refreshVerify(refresh), null);
});

test('password changes, missing Redis state and refresh hash mismatch fail closed', async () => {
  const { api, user, store, hash } = authHarness();
  const access = await api.sign({ id: 7 }, '1h');
  const refresh = await api.refresh({ id: 7 }, '30d');
  assert.equal(await api.refreshVerify(refresh), null);
  user.refreshToken = hash(refresh);
  assert.ok(await api.refreshVerify(refresh));
  user.password = 'changed';
  assert.equal(await api.verify(access), null); assert.equal(await api.refreshVerify(refresh), null);
  user.password = 'synthetic-hash'; store.clear();
  assert.equal(await api.verify(access), null);
});

test('refresh cannot cross a logout or password-change boundary during reissuance', async () => {
  const { api, user } = authHarness();
  const access = await api.sign({ id: 7 }, '1h');
  const old = jose.decodeJwt(access);
  await api.revokeUserSessions(7);
  await assert.rejects(api.sign(old, '1h'), /revoked/);
  const next = jose.decodeJwt(await api.sign({ id: 7 }, '1h'));
  user.password = 'changed';
  await assert.rejects(api.sign(next, '1h'), /Credentials changed/);
});

test('store rich HTML retains formatting and strips active content and URLs', () => {
  const { sanitizeHtml } = load('src/core/utils/html/sanitizeHtml.ts', { 'isomorphic-dompurify': DOMPurify });
  const result = sanitizeHtml('<h2>Title</h2><p><strong>Text</strong></p><img src="/safe.png" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">link</a><svg onload="alert(1)"></svg><iframe srcdoc="evil"></iframe><div style="background:url(https://evil.test)">x</div>');
  assert.match(result, /<h2>Title<\/h2>/); assert.match(result, /<strong>Text<\/strong>/);
  assert.doesNotMatch(result, /onerror|onload|<script|javascript:|<svg|<iframe|style=/);
});

function boardHarness() {
  let permissions = [], board = { status: 'active', config: {} }, cookie;
  const api = load('src/modules/posts/actions/access.ts', {
    'next/headers': { cookies: async () => ({ get: () => cookie }), headers: async () => ({ get: () => null }) },
    '@/core/utils/auth/jwtAuth': {},
    './posts.query': { findModuleById: async () => board, findPermissionsByModuleId: async () => permissions },
    './permission': load('src/modules/posts/actions/permission.ts'),
  });
  return { api, board, setPermissions: p => { permissions = p; }, setCookie: value => { cookie = { value }; } };
}

test('board policy enforces guest/member/group and independent write/comment permissions', async () => {
  const { api, setPermissions, board } = boardHarness();
  const user = { id: 7, isAdmin: false, groups: [2] };
  setPermissions([{ action: 'read', subjectType: 'group', subjectId: 2 }, { action: 'write', subjectType: 'admin' }, { action: 'comment', subjectType: 'admin' }]);
  assert.equal(await api.canAccessBoard(1, 'read', null), false);
  assert.equal(await api.canAccessBoard(1, 'read', user), true);
  assert.equal(await api.canAccessBoard(1, 'write', user), false);
  assert.equal(await api.canAccessBoard(1, 'comment', user), false);
  board.status = 'inactive'; assert.equal(await api.canAccessBoard(1, 'read', user), false);
});

test('secret and consulting files use the same document policy; password change invalidates secret cookie', async () => {
  const { api, board, setCookie } = boardHarness();
  const doc = { slug: 'private', moduleId: 1, userId: 7, isSecrets: true, published: true, authorPassword: 'hash' };
  assert.equal(await api.canReadDocument(doc, null), false);
  assert.equal(await api.canReadDocument(doc, { id: 7 }), true);
  setCookie(api.secretCookieValue(doc.slug, 'hash'));
  assert.equal(await api.canReadDocument(doc, null), true);
  doc.authorPassword = 'changed'; assert.equal(await api.canReadDocument(doc, null), false);
  doc.isSecrets = false; board.config.consultingState = true;
  assert.equal(await api.canReadDocument(doc, { id: 8 }), false);
  assert.equal(await api.canReadDocument(doc, { id: 7 }), true);
});

test('private uploads cannot be downloaded by guests or other users; packages stay protected', async () => {
  let protectedFile = false, readable = false;
  const api = load('src/modules/attachment/lib/access.ts', {
    '@/core/utils/db/prisma': {
      attachment: { findFirst: async () => ({ userId: 7 }) }, appSetting: { findFirst: async () => null },
      profile: { findFirst: async () => null }, comment: { findMany: async () => [] },
      document: { findMany: async ({ where }) => { assert.equal(where.userId, 7); return [{ slug: 'p', thumbnail: '/storage/uploads/private.png' }]; } },
    },
    '@/modules/posts/actions/access': { canReadDocument: async () => readable },
    '@extensions/serverIntegrations': { isProtectedUpload: async () => protectedFile, isPublicUpload: async () => false },
    './parser': load('src/modules/attachment/lib/parser.ts'),
  });
  const path = '/storage/uploads/private.png';
  assert.equal(await api.canReadUpload(path, null), false);
  assert.equal(await api.canReadUpload(path, { id: 8 }), false);
  assert.equal(await api.canReadUpload(path, { id: 7 }), true);
  readable = true; assert.equal(await api.canReadUpload(path, null), true);
  protectedFile = true; assert.equal(await api.canReadUpload(path, { id: 7, isAdmin: true }), false);
});

test('notification helpers are server-only, not externally callable server actions', () => {
  for (const name of ['notification', 'push', 'web-push']) {
    const text = source(`src/modules/notification/actions/${name}.action.ts`);
    assert.match(text, /import "server-only"/);
    assert.doesNotMatch(text, /["']use server["']/);
  }
});

function documentHarness() {
  const document = { id: 5, slug: 'secret', userId: 7, moduleId: 1, isSecrets: true,
    authorPassword: 'private-hash', title: 'Private title', content: 'Private content',
    extraFieldData: { confidential: 'data' }, module: { config: {} } };
  let allowed = false, viewer = null, writes = 0;
  const query = { findDocument: async () => document, findDocumentBySlug: async () => document,
    insertDocument: async () => writes++, updateDocument: async () => writes++ };
  const api = load('src/modules/document/actions/document.action.ts', {
    '@/core/utils/auth/rateLimit': { consumeRateLimit: async () => ({ allowed: true }) },
    '@/modules/posts/actions/access': { getBoardViewer: async () => viewer,
      canAccessBoard: async () => allowed, canReadDocument: async () => allowed, secretCookieValue: () => 'valid-cookie' },
    'next/headers': { cookies: async () => ({ get: () => undefined }) },
    './document.query': query, '@/modules/document/actions/document.query': query,
    'next/cache': {}, '@/modules/posts/actions/posts.query': { findModuleByMid: async () => ({ id: 1 }) },
    './_type': {}, '@utils/validation/formValidator': {},
    '@utils/trigger/triggerWrapper': { withTrigger: (_name, fn) => fn },
    '@/modules/posts/actions/skinCapability': {}, '@/core/utils/auth/password': {},
  });
  return { api, document, setAllowed: value => { allowed = value; }, setViewer: value => { viewer = value; }, writes: () => writes };
}

test('direct document ID action denies restricted boards and masks locked content and hashes', async () => {
  const h = documentHarness();
  assert.equal((await h.api.getDocument(5)).success, false);
  h.setAllowed(true);
  const result = await h.api.getDocument(5);
  assert.equal(result.success, true); assert.equal(result.data.content, null);
  assert.equal(result.data.authorPassword, undefined);
  assert.deepEqual(result.data.extraFieldData, {});
  assert.notEqual(result.data.title, h.document.title);
  h.setViewer({ id: 7 });
  const owner = await h.api.getDocument(5);
  assert.equal(owner.data.content, h.document.content);
  assert.equal(owner.data.authorPassword, undefined);
});

test('document writes reject a logged-in user without board write permission before validation/DB', async () => {
  const h = documentHarness(); h.setViewer({ id: 7 });
  assert.equal((await h.api.saveDocument('restricted', new FormData())).success, false);
  assert.equal(h.writes(), 0);
});

test('comment action rejects missing comment permission even when document read is allowed', async () => {
  let writes = 0;
  const api = load('src/modules/comment/actions/comment.action.ts', {
    '@/modules/posts/actions/access': { getBoardViewer: async () => ({ id: 7 }),
      canReadDocument: async () => true, canAccessBoard: async (_id, action) => action === 'read' },
    './comment.query': { findDocumentCommentAccessInfo: async () => ({ id: 5, moduleId: 1 }), insertComment: async () => writes++ },
    'next/cache': {}, '@utils/trigger/triggerWrapper': { withTrigger: (_name, fn) => fn },
    '@/modules/admin/actions/settings.query': {},
  });
  const form = new FormData(); form.set('documentId', '5'); form.set('content', 'test');
  assert.equal((await api.saveCommentAction(form)).success, false);
  assert.equal(writes, 0);
});

test('notification API ignores forged recipient ID and scopes reads to authenticated user', async () => {
  const api = load('src/app/api/notifications/history/route.ts', {
    'next/server': { NextResponse: { json: data => data } },
    '@/core/utils/auth/authHelper': { getAuthenticatedUser: async () => ({ id: 7 }) },
    '@/modules/notification/actions/notification.action': { findHistoryPage: async id => { assert.equal(id, 7); return []; } },
    '@/modules/admin/actions/settings.action': { getNotificationSettingsRuntimeAction: async () => ({ historyPageSize: 20 }) },
    '../_utils': {},
  });
  assert.deepEqual(await api.GET(new Request('http://localhost/api/notifications/history?userId=999')), []);
});

test('push registration API ignores body userId and requires an authenticated session', async () => {
  let loggedIn = true, target;
  const api = load('src/app/api/mobile/push-tokens/route.ts', {
    'next/server': { NextResponse: { json: (data, init) => ({ data, status: init?.status || 200 }) } },
    '@/core/utils/auth/authHelper': { getAuthenticatedUser: async () => { if (!loggedIn) throw new Error('UNAUTHORIZED'); return { id: 7 }; } },
    '@/modules/notification/actions/push.action': { registerPushTokenAction: async data => { target = data.userId; return { success: true }; } },
  });
  const request = () => new Request('http://localhost/api/mobile/push-tokens', { method: 'POST', body: JSON.stringify({ userId: 999, token: 'x'.repeat(25) }) });
  assert.equal((await api.POST(request())).status, 200); assert.equal(target, 7);
  loggedIn = false; assert.equal((await api.POST(request())).status, 401);
});

test('legacy, expired, tampered and wrong-type JWTs are rejected', async () => {
  const { api } = authHarness();
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const legacy = await new jose.SignJWT({ id: 7, tokenType: 'access' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(secret);
  assert.equal(await api.verify(legacy), null);
  const access = await api.sign({ id: 7 }, '1h');
  assert.equal(await api.refreshVerify(access), null);
  const parts = access.split('.');
  parts[1] = Buffer.from(JSON.stringify({ ...jose.decodeJwt(access), isAdmin: true })).toString('base64url');
  assert.equal(await api.verify(parts.join('.')), null);
  const expired = await new jose.SignJWT(jose.decodeJwt(access)).setProtectedHeader({ alg: 'HS256' }).setExpirationTime(1).sign(secret);
  assert.equal(await api.verify(expired), null);
});

test('original upload URLs are rewritten before static serving and dotted admin paths still require login', async () => {
  const api = load('src/core/proxy/defaultProxy.ts', {
    'next/server': { NextResponse: { next: () => ({ next: true }), rewrite: url => ({ rewrite: url.pathname }), redirect: url => ({ redirect: url.pathname }), json: () => ({ denied: true }) } },
    '@/core/utils/auth/jwtAuth': { verify: async () => null }, '@/core/utils/redis/redis': {},
  });
  const request = pathname => ({ method: 'GET', url: `http://localhost${pathname}`,
    nextUrl: { pathname, clone: () => new URL(`http://localhost${pathname}`) }, cookies: { get: () => undefined } });
  assert.deepEqual(await api.proxy(request('/storage/uploads/private.pdf')), { rewrite: '/api/storage/uploads/private.pdf' });
  assert.deepEqual(await api.proxy(request('/admin/file.csv')), { redirect: '/auth/signin' });
});

test('storage endpoint authorizes before touching disk and refuses traversal and symlink escapes', async () => {
  let allowed = false, touched = 0, symlink = false;
  const api = load('src/app/api/storage/uploads/[...path]/route.ts', {
    'next/server': { NextResponse: { json: (data, init) => ({ data, status: init.status }) } },
    path: require('node:path'),
    'fs/promises': {
      realpath: async path => { touched++; return symlink && path.endsWith('private.pdf') ? '/outside/private.pdf' : path; },
      stat: async () => { touched++; return { isFile: () => true }; },
      readFile: async () => { touched++; return Buffer.from('synthetic'); },
    },
    'mime-types': { lookup: () => 'application/pdf' },
    '@/modules/attachment/lib/access': { canReadUpload: async () => allowed },
    '@/modules/posts/actions/access': { getBoardViewer: async () => null },
  });
  const req = { url: 'http://localhost/api/storage/uploads/private.pdf' };
  assert.equal((await api.GET(req)).status, 403); assert.equal(touched, 0);
  allowed = true;
  assert.equal((await api.GET({ url: 'http://localhost/api/storage/uploads/%2e%2e%2foutside.pdf' })).status, 400);
  assert.equal(touched, 0);
  symlink = true; assert.equal((await api.GET(req)).status, 403);
  symlink = false;
  const response = await api.GET(req);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('content-security-policy'), "sandbox; default-src 'none'");
});

test('registration settings and dedicated password-change flow are enforced by the action itself', async () => {
  let viewer = { id: 0, isAdmin: false }, enabled = false, writes = 0;
  const api = load('src/modules/user/actions/user.action.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'test-token' }) }) },
    '@/core/utils/auth/jwtAuth': {},
    '@/core/utils/auth/safeUser': load('src/core/utils/auth/safeUser.ts'),
    '@utils/auth/password': {},
    './user': { decodeUserToken: async () => viewer, saveUser: async () => { writes++; return { success: true, data: { id: 7 } }; } },
    './_type': {}, './user.query': { findUserById: async () => ({ id: 7, isAdmin: false }) },
    '@utils/validation/formValidator': { validateForm: (_schema, data) => ({ isValid: true, data }) },
    'next/cache': {}, '@utils/redis/redis': {},
    '@/modules/admin/actions/auth-settings': { getAuthSettingsRuntimeAction: async () => ({ registrationEnabled: enabled }) },
    '@/modules/notification/actions/notification.action': {},
  });
  const form = new FormData(); form.set('password', 'new-password');
  assert.equal((await api.saveUserAction(form)).success, false); assert.equal(writes, 0);
  enabled = true;
  assert.equal((await api.saveUserAction(form)).success, true); assert.equal(writes, 1);
  viewer = { id: 7, isAdmin: false }; form.set('id', '7');
  assert.equal((await api.saveUserAction(form)).success, false); assert.equal(writes, 1);
  form.delete('password');
  assert.equal((await api.saveUserAction(form)).success, true); assert.equal(writes, 2);
  form.set('id', '-1');
  assert.equal((await api.saveUserAction(form)).success, false);
  form.delete('id'); enabled = false; viewer = { id: 1, isAdmin: true };
  assert.equal((await api.saveUserAction(form)).success, true); assert.equal(writes, 3);
});

test('rate limits use atomic expiring Redis counters and normalize subjects without storing email', async () => {
  const counts = new Map(); let unavailable = false;
  const api = load('src/core/utils/auth/rateLimit.ts', {
    '@/core/utils/redis/redis': { eval: async (script, numKeys, key, seconds) => {
      if (unavailable) throw new Error('Redis unavailable');
      assert.equal(numKeys, 1); assert.match(script, /INCR/); assert.match(script, /EXPIRE/);
      assert.ok(!key.includes('@')); assert.ok(seconds > 0);
      const count = (counts.get(key) || 0) + 1; counts.set(key, count); return [count, seconds];
    } },
  });
  assert.equal(await api.allowRecoveryRequest(' Member@example.com '), true);
  assert.equal(await api.allowRecoveryRequest('member@example.com'), true);
  assert.equal(await api.allowRecoveryRequest('MEMBER@EXAMPLE.COM'), true);
  assert.equal(await api.allowRecoveryRequest('member@example.com'), false);
  const results = await Promise.all(Array.from({ length: 20 }, () => api.consumeRateLimit('secret', 'same-post', 10, 900)));
  assert.equal(results.filter(r => r.allowed).length, 10);
  counts.clear(); assert.equal(await api.allowRecoveryRequest('member@example.com'), true);
  unavailable = true; await assert.rejects(api.allowRecoveryRequest('member@example.com'), /unavailable/);
});

test('QR throttle runs before session writes and returns Retry-After', async () => {
  let writes = 0;
  const api = load('src/app/api/auth/qr/route.ts', {
    '@/core/utils/auth/rateLimit': { consumeRateLimit: async () => ({ allowed: false, retryAfter: 45 }) },
    qrcode: {}, 'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    './_utils': { createRandomToken: () => { writes++; }, writeQrLoginSession: async () => { writes++; } },
  });
  const result = await api.POST({});
  assert.equal(result.status, 429); assert.equal(result.headers['Retry-After'], '45'); assert.equal(writes, 0);
});

test('secret password throttle rejects before expensive password verification', async () => {
  let checks = 0;
  const document = { id: 1, slug: 'private', isSecrets: true, authorPassword: 'hash' };
  const api = load('src/modules/document/actions/document.action.ts', {
    '@/core/utils/auth/rateLimit': { consumeRateLimit: async () => ({ allowed: false }) },
    '@/modules/posts/actions/access': { getBoardViewer: async () => null, canReadDocument: async () => true },
    'next/headers': {}, './document.query': {}, '@/modules/document/actions/document.query': { findDocumentBySlug: async () => document },
    'next/cache': {}, '@/modules/posts/actions/posts.query': {}, './_type': {}, '@utils/validation/formValidator': {},
    '@utils/trigger/triggerWrapper': { withTrigger: (_name, fn) => fn }, '@/modules/posts/actions/skinCapability': {},
    '@/core/utils/auth/password': { verifyPassword: async () => { checks++; return false; } },
  });
  assert.equal((await api.unlockDocumentSecretAction('private', 'guess')).success, false);
  assert.equal(checks, 0);
});

test('login rate-limit identity cannot be changed by spoofing forwarded IP headers', () => {
  const text = source('src/app/api/auth/signin/route.ts');
  const start = text.indexOf('const getLoginRateLimitKeys');
  const end = text.indexOf('const getLoginRateLimitStatus');
  const factory = text.slice(start, end).replace('const getLoginRateLimitKeys', 'export const getLoginRateLimitKeys');
  const compiled = ts.transpileModule(factory, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('exports', 'createHash', compiled)(exports, require('node:crypto').createHash);
  assert.deepEqual(exports.getLoginRateLimitKeys('Member', '198.51.100.1'), exports.getLoginRateLimitKeys('member', '203.0.113.7'));
});
