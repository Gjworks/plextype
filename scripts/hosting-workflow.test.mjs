import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
function load(file, mocks = {}) {
  const source = readFileSync(new URL(`../src/extensions/service/${file}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(name => { if (name in mocks) return mocks[name]; throw new Error(name); }, exports);
  return exports;
}
const workflow = load('hostingWorkflow.ts');
test('only supported GitHub repository addresses are accepted', () => {
  for (const url of ['https://github.com/friend/site', 'git@github.com:friend/site.git', 'ssh://git@github.com/friend/site.git']) assert.equal(workflow.githubSshRepository(url), 'git@github.com:friend/site.git');
  for (const url of ['https://github.com.evil/friend/site', 'git@github.com:../site.git', 'https://user:secret@github.com/friend/site', 'file:///tmp/repo', 'git@github.com:friend/site;ls.git']) assert.equal(workflow.githubSshRepository(url), null);
});
function harness(user = { id: 7, isAdmin: false }) {
  let writes = [], status = 'requested';
  const request = { id: 10, requestedByUserId: 7, source: 'service', serviceName: 'sample', originRepository: 'git@github.com:friend/site.git', status };
  const api = load('actions/hosting.action.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'test' }) }) },
    'next/cache': { revalidatePath() {} }, '@/core/utils/auth/jwtAuth': { verify: async () => user },
    '@/core/utils/auth/rateLimit': { consumeRateLimit: async () => ({ allowed: true }) },
    '../hostingWorkflow': workflow,
    './deploy.query': {
      findServiceDeployRequestByUuid: async () => request,
      findServiceDeployJobsByInstanceId: async () => [{ type: 'install', status, payload: { publicKey: 'ssh-ed25519 public', privateKey: 'NEVER_EXPOSE', adminPassword: 'NEVER_EXPOSE' } }],
      transitionHostingWorkflow: async args => { if (!args.from.includes(status)) return false; status = args.to; writes.push(args); return true; },
    },
  });
  return { api, writes, setStatus: next => status = next };
}
test('applicant cannot approve and other users cannot read or advance the request', async () => {
  const own = harness(); assert.equal((await own.api.acceptHostingAdminAction('request')).success, false);
  for (const user of [null, { id: 8, isAdmin: false }]) {
    const { api, writes } = harness(user);
    assert.equal(await api.getHostingKeyAction('request'), null);
    for (const name of ['verifyHostingAccessAction', 'requestHostingInstallAction', 'cancelHostingAdminAction']) assert.equal((await api[name]('request')).success, false);
    assert.equal(writes.length, 0);
  }
});
test('key DTO excludes internal payload and secrets', async () => {
  const result = await harness().api.getHostingKeyAction('request');
  assert.equal(result.publicKey, 'ssh-ed25519 public');
  assert.ok(!JSON.stringify(result).includes('NEVER_EXPOSE'));
});
test('approval only queues key generation; verification never queues installation', async () => {
  const { api, writes, setStatus } = harness({ id: 1, isAdmin: true });
  assert.equal((await api.acceptHostingAdminAction('request')).success, true);
  assert.equal(writes[0].to, 'key_pending');
  assert.equal((await api.acceptHostingAdminAction('request')).success, false);
  assert.equal((await api.requestHostingInstallAction('request')).success, false);
  setStatus('awaiting_key');
  assert.equal((await api.verifyHostingAccessAction('request')).success, true);
  assert.equal(writes.at(-1).to, 'checking_access');
  assert.equal((await api.requestHostingInstallAction('request')).success, false);
  setStatus('access_verified');
  assert.equal((await api.requestHostingInstallAction('request')).success, true);
  assert.equal(writes.at(-1).step, 'ready-to-run');
  assert.equal((await api.requestHostingInstallAction('request')).success, false);
});

test('locked transition rejects wrong owners, edited repositories and missing verification', async () => {
  let row, writes = [];
  const tx = { $queryRaw: async () => [row], $executeRaw: async (...args) => { writes.push(args); return 1; } };
  const { transitionHostingWorkflow } = load('actions/deploy.query.ts', {
    '@/core/utils/db/prisma': { default: { $transaction: async fn => fn(tx) } },
  });
  const original = { id: 1, source: 'service', status: 'access_verified', requestedByUserId: 7, workflowType: 'install', workflowStatus: 'access_verified', workflowJobId: 2, originRepository: 'git@github.com:friend/site.git', deployBranch: 'main', workflowPayload: { hostingWorkflow: 1, acceptedBy: 1, originRepository: 'git@github.com:friend/site.git', deployBranch: 'main', publicKey: 'public', verifiedAt: 'now', verifiedOrigin: 'git@github.com:friend/site.git' } };
  const input = { uuid: 'request', actorId: 7, admin: false, from: ['access_verified'], to: 'running', step: 'ready-to-run' };
  row = structuredClone(original);
  assert.equal(await transitionHostingWorkflow({ ...input, actorId: 8 }), false);
  row.originRepository = 'git@github.com:friend/other.git';
  assert.equal(await transitionHostingWorkflow(input), false);
  row = structuredClone(original); delete row.workflowPayload.verifiedAt;
  assert.equal(await transitionHostingWorkflow(input), false);
  row = structuredClone(original); row.workflowStatus = 'requested';
  assert.equal(await transitionHostingWorkflow(input), false);
  assert.equal(writes.length, 0);
  row = structuredClone(original);
  assert.equal(await transitionHostingWorkflow(input), true);
  assert.equal(writes.length, 2);
});
