import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
function load(file, mocks = {}) {
  const source = fs.readFileSync(new URL(file, root), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id in mocks ? mocks[id] : require(id), module, module.exports);
  return module.exports;
}
const domain = load('src/modules/notification/broadcast.ts');
const draft = { audience: 'users', ids: [1, 1, 2], title: ' 운영 안내 ', content: '내용', linkUrl: '/user/notifications', channels: { notification: true, web: false, app: false } };
assert.deepEqual(domain.validateBroadcast(draft).ids, [1, 2]);
assert.equal(domain.validateBroadcast(draft).title, '운영 안내');
for (const patch of [{ audience: 'bad' }, { ids: [] }, { ids: [0] }, { title: '' }, { title: 'a'.repeat(101) }, { content: 'a'.repeat(2001) }, { audience: 'all' }, { channels: { notification: false, web: false, app: false, extra: true } }]) assert.throws(() => domain.validateBroadcast({ ...draft, ...patch }));
for (const linkUrl of ['https://evil.test', '//evil.test', '/\\evil.test', 'javascript:alert(1)', '/ foo']) assert.throws(() => domain.validateBroadcast({ ...draft, linkUrl }));
assert.equal(domain.validateBroadcast({ ...draft, audience: 'all', ids: [] }).audience, 'all');
assert.throws(() => domain.validateBroadcastId('bad'));
const id = '550e8400-e29b-41d4-a716-446655440000';
domain.validateBroadcastId(id);
let isAdmin = false;
let touched = 0;
let eligible = true;
let webThrows = false;
let batch = [{ id: 1, userId: 1 }];
let currentDraft = domain.validateBroadcast(draft);
const calls = [];
const query = {
  listBroadcastGroupsQuery: async () => [{ id: 1, label: '일반 회원', detail: 'member' }, { id: 2, label: '파트너', detail: 'partner' }],
  broadcastTablesReadyQuery: async () => { touched++; return true; },
  listBroadcastsQuery: async () => [{ id, draft: currentDraft }],
  claimBroadcastRecipientsQuery: async () => { const result = batch; batch = []; return result; },
  recipientStillEligibleQuery: async () => eligible,
  saveBroadcastNotificationQuery: async () => { calls.push('notification'); return {}; },
  finishBroadcastRecipientQuery: async (_, status, result) => calls.push({ status, result }),
};
const actions = load('src/modules/notification/actions/broadcast.action.ts', {
  '@/modules/user/actions/user.action': { getUserSessionAction: async () => ({ success: true, data: { id: 1, isAdmin } }) },
  '@/modules/admin/actions/settings.action': { getNotificationSettingsRuntimeAction: async () => ({ webPushEnabled: true, fcmPushEnabled: true }) },
  '@/core/utils/trigger/notificationEvents': { notificationEvents: { emit() {} } },
  './broadcast.query': query,
  '../broadcast': domain,
  './push.action': { sendPushNotificationAction: async () => { calls.push('app'); return { success: true, sent: 1, failed: 0 }; } },
  './web-push.action': { sendWebPushNotificationAction: async () => { calls.push('web'); if (webThrows) throw new Error('test transport failure'); return { success: true, sent: 1, failed: 0 }; } },
});
for (const [name, args] of [ ['getBroadcastOverviewAdminAction', []], ['searchBroadcastRecipientsAdminAction', ['users', '']], ['previewBroadcastAdminAction', [draft]], ['createBroadcastAdminAction', [id, draft, 2]], ['processBroadcastBatchAdminAction', [id]], ['getBroadcastResultsAdminAction', [id]] ]) {
  const result = await actions[name](...args);
  assert.equal(result.success, false, name);
  assert.match(result.message, /관리자/);
}
assert.equal(touched, 0);
isAdmin = true;
assert.deepEqual((await actions.getBroadcastOverviewAdminAction()).data.groups, await query.listBroadcastGroupsQuery());
await actions.processBroadcastBatchAdminAction(id);
assert.equal(calls[0], 'notification');
assert.equal(calls[1].status, 'done');
calls.length = 0;
await actions.processBroadcastBatchAdminAction(id);
assert.equal(calls.length, 0, 'claimed recipients must not resend');
batch = [{ id: 2, userId: 2 }]; eligible = false;
await actions.processBroadcastBatchAdminAction(id);
assert.equal(calls[0].status, 'skipped');
assert.equal(calls.length, 1);
calls.length = 0; eligible = true; webThrows = true;
batch = [{ id: 3, userId: 3 }];
currentDraft = { ...currentDraft, channels: { notification: false, web: true, app: true } };
const originalError = console.error;
try { console.error = () => {}; await actions.processBroadcastBatchAdminAction(id); } finally { console.error = originalError; }
assert.deepEqual(calls.slice(0, 2), ['web', 'app']);
assert.equal(calls[2].status, 'unknown');

const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const template = load('src/modules/admin/components/AdminPageTemplate.tsx', { 'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) } });
const UI = load('src/modules/notification/admin/BroadcastAdmin.tsx', { '@/modules/admin/components/AdminPageTemplate': template, '../actions/broadcast.action': actions }).default;
for (const history of [false, true]) {
  const html = renderToStaticMarkup(React.createElement(UI, { history, initial: { ready: false, webEnabled: false, appEnabled: false, jobs: [], groups: [] } }));
  assert.match(html, /DB 마이그레이션/);
  assert.match(html, /메시지 발송/);
  assert.match(html, /발송 내역/);
  if (!history) { assert.match(html, /fieldset disabled/); assert.match(html, /전체 회원/); }
}
const GroupUI = load('src/modules/notification/admin/BroadcastAdmin.tsx', {
  react: { ...React, useState: initial => React.useState(initial?.audience ? { ...initial, audience: 'groups' } : initial) },
  '@/modules/admin/components/AdminPageTemplate': template,
  '../actions/broadcast.action': actions,
}).default;
const groupHtml = renderToStaticMarkup(React.createElement(GroupUI, { history: false, initial: { ready: true, webEnabled: false, appEnabled: false, jobs: [], groups: await query.listBroadcastGroupsQuery() } }));
assert.match(groupHtml, /일반 회원/);
assert.match(groupHtml, /파트너/);
assert.doesNotMatch(groupHtml, /닉네임, 계정 또는 이메일|그룹 이름|회원 검색/);
console.log('notification broadcast: validation, admin authorization, channel isolation, opt-out, no resend, and UI render passed');
