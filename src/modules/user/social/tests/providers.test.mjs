// 기본 제공자 목록과 목록 합치기, 설정 판정, 인가 주소, 토큰 교환과 회원 정보 해석을 가짜 fetch로 확인한다.
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import test from 'node:test';

const api = await import('../providers/index.ts');
const { appleClientSecret } = await import('../providers/apple.ts');
// 기본 제공자를 key로 찾는다. 없으면 null.
const find = key => api.BUILT_IN_PROVIDERS.find(provider => provider.key === key) ?? null;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const input = { code: 'code-1', redirectUri: 'https://site.test/cb', state: 'state-1' };
const keys = { clientId: 'c', clientSecret: 's' };
// 토큰 요청에는 access_token을, 그 밖의 주소에는 주어진 응답을 돌려주는 가짜 fetch.
const serving = pages => async url => {
  if (/token/.test(String(url))) return json({ access_token: 't' });
  const match = Object.entries(pages).find(([part]) => String(url).includes(part));
  return match ? json(match[1]) : json({}, 404);
};
const profileOf = (key, pages) => find(key).fetchProfile(keys, input, serving(pages));

test('every provider is complete enough to appear in the settings screen and on a button', () => {
  assert.deepEqual(api.BUILT_IN_PROVIDERS.map(provider => provider.key), ['kakao', 'naver', 'google', 'apple', 'github', 'facebook']);
  for (const provider of api.BUILT_IN_PROVIDERS) {
    assert.match(provider.key, api.PROVIDER_KEY_PATTERN);
    assert.ok(provider.label && provider.brand.background && provider.brand.color);
    assert.ok(provider.fields.some(field => field.name === 'clientId'));
    assert.equal(new Set(provider.fields.map(field => field.name)).size, provider.fields.length);
    assert.match(provider.guide.consoleUrl, /^https:\/\//);
    assert.ok(provider.guide.steps.length > 0);
  }
  assert.equal(find('kakao').label, '카카오');
  assert.equal(find('nope'), null);
});

test('registered providers follow the built-in ones; the same key replaces in place and unusable definitions are dropped', t => {
  t.mock.method(console, 'error', () => {});
  const custom = key => api.oauth2Provider({
    key, label: key, brand: { background: '#000', color: '#fff' }, fields: [api.CLIENT_ID_FIELD()], guide: { consoleName: 'c', consoleUrl: 'https://c.test', steps: ['s'] },
    authorizeEndpoint: 'https://c.test/authorize', tokenEndpoint: 'https://c.test/token', loadProfile: async () => null,
  });
  const merged = api.mergeProviders(api.BUILT_IN_PROVIDERS, api.defineSocialProviders([custom('line')]), [custom('naver'), custom('discord')]);
  assert.deepEqual(merged.map(provider => provider.key), ['kakao', 'naver', 'google', 'apple', 'github', 'facebook', 'line', 'discord']);
  assert.equal(merged[1].label, 'naver');
  // key는 주소와 저장 키에 그대로 들어가므로 형식을 벗어난 것은 받지 않는다.
  const rejected = api.mergeProviders([custom('Bad Key'), custom('a'.repeat(33)), { key: 'half' }, null, custom('ok')]);
  assert.deepEqual(rejected.map(provider => provider.key), ['ok']);
  assert.equal(console.error.mock.callCount(), 4);
});

test('a provider can be turned on only when its required values are present', () => {
  const [kakao, naver, apple] = ['kakao', 'naver', 'apple'].map(find);
  assert.equal(api.isComplete(kakao, {}), false);
  // 카카오의 시크릿은 선택이다.
  assert.equal(api.isComplete(kakao, { clientId: 'id' }), true);
  assert.equal(api.isComplete(naver, { clientId: 'id' }), false);
  assert.equal(api.isComplete(naver, { clientId: 'id', clientSecret: '  ' }), false);
  assert.equal(api.isComplete(naver, { clientId: 'id', clientSecret: 'sec' }), true);
  assert.equal(api.isComplete(apple, { clientId: 'id', teamId: 't', keyId: 'k' }), false);
  assert.deepEqual(api.requiredFields(apple).map(field => field.name), ['clientId', 'teamId', 'keyId', 'privateKey']);
});

test('the authorize url carries the client, callback and state; scope only where the provider needs it', () => {
  const google = new URL(find('google').authorizeUrl({ clientId: 'g', clientSecret: 's' }, { redirectUri: 'https://site.test/cb', state: 'st' }));
  assert.equal(google.origin + google.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  assert.deepEqual(
    ['response_type', 'client_id', 'redirect_uri', 'state', 'scope'].map(name => google.searchParams.get(name)),
    ['code', 'g', 'https://site.test/cb', 'st', 'openid email profile'],
  );
  const kakao = new URL(find('kakao').authorizeUrl({ clientId: 'k' }, { redirectUri: 'https://site.test/cb', state: 'st' }));
  assert.equal(kakao.searchParams.has('scope'), false);
  // 애플은 결과를 POST로 돌려주므로 주소도 출처 검사를 받지 않는 쪽을 쓴다.
  const apple = new URL(find('apple').authorizeUrl({ clientId: 'a' }, { redirectUri: 'https://site.test/cb', state: 'st' }));
  assert.deepEqual([apple.searchParams.get('response_mode'), apple.searchParams.get('scope')], ['form_post', 'name email']);
  assert.equal(api.callbackUrl('https://site.test', find('naver')), 'https://site.test/api/social-login/naver/callback');
  assert.equal(api.callbackUrl('https://site.test', find('apple')), 'https://site.test/api/external-callback/social-login/apple');
});

test('the code is exchanged with the secret when there is one, and the token is used to read the profile', async () => {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    return calls.length % 2 === 1
      ? json({ access_token: 'token-1' })
      : json({ id: 42, kakao_account: { email: 'a@b.test', is_email_valid: true, is_email_verified: true, profile: { nickname: '홍길동' } } });
  };
  const kakao = find('kakao');
  assert.deepEqual(await kakao.fetchProfile({ clientId: 'k', clientSecret: 'sec' }, input, fetcher), { id: '42', email: 'a@b.test', name: '홍길동' });
  assert.equal(calls[0].url, 'https://kauth.kakao.com/oauth/token');
  assert.deepEqual(Object.fromEntries(calls[0].init.body), {
    grant_type: 'authorization_code', client_id: 'k', redirect_uri: input.redirectUri, code: 'code-1', state: 'state-1', client_secret: 'sec',
  });
  assert.equal(calls[1].init.headers.Authorization, 'Bearer token-1');

  // 시크릿이 없으면 보내지 않는다.
  await kakao.fetchProfile({ clientId: 'k' }, input, fetcher);
  assert.equal(calls[2].init.body.has('client_secret'), false);
});

test('only an email the provider confirmed is kept', async () => {
  assert.equal((await profileOf('kakao', { 'user/me': { id: 1, kakao_account: { email: 'a@b.test', is_email_valid: true, is_email_verified: false } } })).email, null);
  assert.equal((await profileOf('kakao', { 'user/me': { id: 1 } })).email, null);
  assert.deepEqual(await profileOf('google', { userinfo: { sub: 'g-1', email: 'a@b.test', email_verified: false, name: 'A' } }), { id: 'g-1', email: null, name: 'A' });
  assert.deepEqual(await profileOf('google', { userinfo: { sub: 'g-1', email: 'a@b.test', email_verified: true } }), { id: 'g-1', email: 'a@b.test', name: null });
  assert.deepEqual(
    await profileOf('naver', { 'nid/me': { resultcode: '00', response: { id: 'n-1', email: 'a@b.test', name: '이름' } } }),
    { id: 'n-1', email: 'a@b.test', name: '이름' },
  );
  assert.deepEqual(await profileOf('facebook', { '/me': { id: 'f-1', name: 'F', email: 'a@b.test' } }), { id: 'f-1', email: 'a@b.test', name: 'F' });
});

test('github takes the verified primary email from the email list, not the public profile email', async () => {
  const user = { id: 7, login: 'octo', name: null, email: 'public@b.test' };
  assert.deepEqual(
    await profileOf('github', { 'user/emails': [{ email: 'old@b.test', primary: false, verified: true }, { email: 'main@b.test', primary: true, verified: true }], '/user': user }),
    { id: '7', email: 'main@b.test', name: 'octo' },
  );
  assert.equal((await profileOf('github', { 'user/emails': [{ email: 'main@b.test', primary: true, verified: false }], '/user': user })).email, null);
});

test('apple signs a short-lived client secret and reads the member from the id token', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const config = { clientId: 'com.site.signin', teamId: 'TEAM', keyId: 'KEY', privateKey: privateKey.export({ format: 'pem', type: 'pkcs8' }) };
  const [header, payload, signature] = appleClientSecret(config, 1000).split('.');
  const decode = part => JSON.parse(Buffer.from(part, 'base64url').toString());
  assert.deepEqual(decode(header), { alg: 'ES256', kid: 'KEY' });
  assert.deepEqual(decode(payload), { iss: 'TEAM', iat: 1000, exp: 1300, aud: 'https://appleid.apple.com', sub: 'com.site.signin' });
  assert.equal(verify('sha256', Buffer.from(`${header}.${payload}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(signature, 'base64url')), true);

  const idToken = claims => `x.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.y`;
  const apple = find('apple');
  const calls = [];
  const fetcher = claims => async (url, init) => { calls.push({ url, init }); return json({ id_token: idToken(claims) }); };
  assert.deepEqual(await apple.fetchProfile(config, input, fetcher({ sub: 'a-1', email: 'a@b.test', email_verified: 'true' })), { id: 'a-1', email: 'a@b.test', name: null });
  assert.equal(calls[0].url, 'https://appleid.apple.com/auth/token');
  assert.equal(calls[0].init.body.get('client_secret').split('.').length, 3);
  assert.equal((await apple.fetchProfile(config, input, fetcher({ sub: 'a-1', email: 'a@b.test', email_verified: false }))).email, null);
  await assert.rejects(apple.fetchProfile(config, input, async () => json({ error: 'invalid_grant' }, 400)), /토큰 발급 실패/);
});

test('a failed exchange or an unreadable profile is an error, never a login', async () => {
  const google = find('google');
  await assert.rejects(google.fetchProfile(keys, input, async () => json({ error: 'invalid_grant' }, 400)), /토큰 발급 실패/);
  await assert.rejects(google.fetchProfile(keys, input, async () => json({ token_type: 'bearer' })), /토큰 발급 실패/);
  await assert.rejects(profileOf('naver', { 'nid/me': { resultcode: '024' } }), /회원 정보 조회 실패/);
  await assert.rejects(profileOf('github', {}), /회원 정보 조회 실패/);
});
