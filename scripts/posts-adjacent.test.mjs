import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file, mocks) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(id => id in mocks ? mocks[id] : require(id), exports);
  return exports;
}
const calls = [];
const date = new Date('2026-09-15T00:00:00Z');
const query = load('src/modules/posts/actions/adjacent.query.ts', {
  '@/core/utils/db/prisma': { __esModule: true, default: { document: { findFirst: async args => { calls.push(args); return calls.length === 1 ? { id: 42, createdAt: date } : null; } } } },
});
await query.findAdjacentPostsQuery(7, 'current', 3);
assert.equal(calls[0].where.moduleId, 7);
assert.equal(calls[0].where.userId, 3);
for (const args of calls.slice(1)) {
  assert.equal(args.where.AND[0].moduleId, 7);
  assert.equal(args.where.AND[0].userId, 3);
  assert.deepEqual(args.where.AND[0].OR, [{ isSecrets: false }, { isSecrets: null }]);
  assert.deepEqual(args.select, { slug: true, title: true });
}
assert.deepEqual(calls[1].where.AND[1].OR[1], { createdAt: date, id: { lt: 42 } });
assert.deepEqual(calls[2].where.AND[1].OR[1], { createdAt: date, id: { gt: 42 } });
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let neighbors = { previous: { slug: 'older', title: '<script>long title</script>' }, next: null };
const Component = load('src/modules/posts/tpl/default/adjacentPosts.tsx', {
  'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
  '../../actions/adjacent.action': { getAdjacentPostsAction: async () => neighbors },
}).default;
const html = renderToStaticMarkup(await Component({ mid: 'blog', slug: 'current' }));
assert.match(html, /href="\/posts\/blog\/older"/);
assert.match(html, /다음 글이 없습니다/);
assert.match(html, /&lt;script&gt;/);
assert.match(html, /sm:grid-cols-2/);
neighbors = { previous: null, next: null };
assert.equal(await Component({ mid: 'blog', slug: 'current' }), null);
console.log('adjacent posts: board/owner/secret scope, timestamp tie-break, links, empty state and rendering passed');
