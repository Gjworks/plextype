// 관리자 메뉴가 코어의 것과 확장(패키지·프로젝트 확장)의 것으로 나뉘어 표시되는지, 사이드바가 확장 메뉴를 "확장 기능" 아래 어디에 모으는지 확인한다.
import assert from 'node:assert/strict';
import test from 'node:test';

const { buildExtensionRegistry } = await import('../src/core/registry/build.ts');
const { groupAdminMenus } = await import('../src/core/registry/adminMenuGroups.ts');

const moduleWith = (key, menu) => ({ key, label: key, description: '', admin: { menu } });
const menu = (id, extra = {}) => ({ id, label: id, icon: null, ...extra });

test('menus from the first registry are core; later registries and marked package menus are extensions', () => {
  const core = { modules: [
    moduleWith('admin', [menu('dashboard', { href: '/admin', order: 10 }), menu('settings', { order: 9999, items: [{ label: '기본', href: '/admin/settings' }] })]),
    // 코어 레지스트리에 함께 들어오는 쉬운 설치 패키지의 메뉴는 표시가 붙어 온다.
    moduleWith('social-login', menu('social-login', { href: '/admin/social-login', extension: true })),
  ] };
  const project = { modules: [
    moduleWith('store', menu('store', { order: 70, items: [{ label: '상품', href: '/admin/store' }] })),
    // 코어 메뉴에 하위 항목만 더하면 그 항목은 코어 메뉴 안에 들어가고, 메뉴는 코어로 남는다.
    moduleWith('store-settings', menu('settings', { items: [{ label: 'Store 설정', href: '/admin/settings/store' }] })),
  ] };
  const { adminMenus } = buildExtensionRegistry(core, project);
  assert.deepEqual(adminMenus.map(item => [item.id, item.extension]), [
    ['dashboard', false], ['store', true], ['social-login', true], ['settings', false],
  ]);
  assert.deepEqual(adminMenus.find(item => item.id === 'settings').items.map(item => item.href), ['/admin/settings', '/admin/settings/store']);
});

test('extension menus are gathered right below easy install, and the sidebar stays whole without any', () => {
  const ids = groups => [groups.before, groups.extensions, groups.after].map(list => list.map(item => item.id));
  const menus = [
    menu('dashboard', { order: 10 }), menu('installer', { order: 60 }), menu('store', { order: 70, extension: true }),
    menu('social-login', { extension: true }), menu('custom'), menu('settings', { order: 9999 }),
  ];
  assert.deepEqual(ids(groupAdminMenus(menus)), [['dashboard', 'installer'], ['store', 'social-login'], ['custom', 'settings']]);
  // 쉬운 설치보다 뒤에 오는 코어 메뉴가 없으면 맨 끝에 놓인다.
  assert.deepEqual(ids(groupAdminMenus([menu('dashboard', { order: 10 }), menu('store', { extension: true })])), [['dashboard'], ['store'], []]);
  assert.deepEqual(ids(groupAdminMenus([menu('dashboard', { order: 10 })])), [['dashboard'], [], []]);
});
