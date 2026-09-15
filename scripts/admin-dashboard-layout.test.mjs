import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const compiled = ts.transpileModule(read('../src/modules/admin/dashboard/layout.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const api = {};
new Function('exports', compiled)(api);
const defaults = { 'posts.documents': 6, 'posts.comments': 6, 'admin.system': 4, 'service.support': 6 };
const parse = value => api.parseDashboardLayout(JSON.stringify(value), defaults);

test('saved order and custom widths survive layout selection', () => {
  const layout = [{ id: 'service.support', colSpan: 12 }, { id: 'posts.comments', colSpan: 3 }, { id: 'posts.documents', colSpan: 9 }];
  assert.deepEqual(parse(layout), layout);
  assert.equal(api.DASHBOARD_WIDGET_STORAGE_KEY, 'gjworks.admin.dashboard.widgets');
});

test('legacy widget IDs and sizes remain compatible', () => {
  assert.deepEqual(parse(['admin.system', { id: 'posts.documents', size: 'wide' }]), [
    { id: 'admin.system', colSpan: 4 }, { id: 'posts.documents', colSpan: 8 },
  ]);
});

test('invalid storage and intentionally empty layouts remain empty', () => {
  for (const raw of [null, '{broken', '{}', 'null', '[]']) assert.deepEqual(api.parseDashboardLayout(raw, defaults), []);
});

test('missing modules, duplicates and invalid widths are handled safely', () => {
  assert.deepEqual(parse([null, 1, 'toString', 'removed.module', { id: 'admin.system', colSpan: 99 }, 'admin.system', { id: 'posts.comments', colSpan: 3.5 }]), [
    { id: 'admin.system', colSpan: 4 }, { id: 'posts.comments', colSpan: 6 },
  ]);
  assert.deepEqual(api.parseDashboardLayout('["service.support","posts.documents"]', { 'posts.documents': 6 }), [{ id: 'posts.documents', colSpan: 6 }]);
});

test('core dashboard and editor share the persistence contract without importing extension widgets', () => {
  const renderer = read('../src/modules/admin/dashboard/Dashboard.tsx');
  assert.doesNotMatch(renderer, /from ['"]@\/?extensions|import\(['"]@\/?extensions/);
  assert.match(renderer, /parseDashboardLayout/);
  assert.match(read('../src/modules/admin/tpl/dashboardConfig.tsx'), /parseDashboardLayout/);
  assert.match(read('../src/layouts/admin/default/Dashboard.tsx'), /modules\/admin\/dashboard\/Dashboard/);
  const registry = read('../src/extensions/layouts/admin/registry.tsx');
  assert.match(registry, /gjworksDefaultAdminLayout/);
  assert.equal((registry.match(/dashboard: ProjectAdminDashboard/g) || []).length, 2);
  assert.match(read('../src/extensions/registry.tsx'), /adminLayouts:\s*\[\s*gjworksDefaultAdminLayout,/);
});

test('dashboard renders saved widget order and grid widths with optional extension widgets', () => {
  const require = createRequire(import.meta.url);
  let savedState = [];
  let effect;
  const compiledRenderer = ts.transpileModule(read('../src/modules/admin/dashboard/Dashboard.tsx'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const container = ({ initial, animate, ...props }) => React.createElement('div', props);
  const mockedRequire = name => {
    if (name === 'react') return {
      ...React,
      useMemo: callback => callback(),
      useState: () => [savedState, next => { savedState = next; }],
      useEffect: callback => { effect = callback; },
    };
    if (name === './layout') return api;
    if (name === 'next/dynamic') return () => () => React.createElement('span', null, 'widget body');
    if (name === 'next/navigation') return { useRouter: () => ({ push() {} }) };
    if (name === 'framer-motion') return { motion: { div: container, section: container } };
    if (name === '@/core/components/button/Button') return ({ fullWidth, icon, ...props }) => React.createElement('button', props);
    return require(name);
  };
  const renderer = {};
  new Function('require', 'exports', compiledRenderer)(mockedRequire, renderer);
  const previousWindow = globalThis.window;
  globalThis.window = {
    localStorage: { getItem: () => JSON.stringify([
      { id: 'service.support', colSpan: 12 },
      { id: 'posts.comments', colSpan: 3 },
      { id: 'posts.documents', colSpan: 9 },
    ]) },
    addEventListener() {}, removeEventListener() {},
  };
  try {
    const props = { additionalWidgets: {
      'service.support': { title: 'Support test', eyebrow: 'Service', bare: false, defaultColSpan: 6, Component: () => React.createElement('span', null, 'support body') },
    } };
    renderToStaticMarkup(React.createElement(renderer.default, props));
    const cleanup = effect();
    const html = renderToStaticMarkup(React.createElement(renderer.default, props));
    assert.ok(html.indexOf('Support test') < html.indexOf('Recent Comments'));
    assert.ok(html.indexOf('Recent Comments') < html.indexOf('Recent Documents'));
    for (const width of [12, 3, 9]) assert.ok(html.includes(`xl:col-span-${width}`));
    cleanup();
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
