import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const out = {};
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'exports', code)(id => id in mocks ? mocks[id] : require(id), out);
  return out;
}
const { buildExtensionRegistry } = load('src/core/registry/build.ts');
const list = () => null;
const read = () => null;
const registry = buildExtensionRegistry({ postSkins: [{ key: 'blog', list, read }, { key: 'issuetracker', list }] });
assert.equal(registry.postSkins.blog, list);
assert.equal(registry.postReadSkins.blog, read);
assert.equal(registry.postReadSkins.issuetracker, undefined);
const BlogRead = load('src/extensions/blog-skin/tpl/read.tsx', {
  '@/modules/posts/tpl/default/articleWithToc': { __esModule: true, default: ({ children }) => React.createElement('div', { 'data-toc': true }, children) },
  'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
  '@/core/utils/date/kst': { toKstDayjs: () => ({ format: () => '2026.09.15' }) },
}).default;
const html = renderToStaticMarkup(React.createElement(BlogRead, {
  document: { title: '<script>title</script>', createdAt: '2026-09-15', user: null, extraFieldData: { tag: 'value' } },
  postInfo: { mid: 'blog', moduleName: '블로그', extraFields: [{ name: 'tag', label: '분류' }] },
  content: React.createElement('p', {}, '검증된 본문'), navigation: React.createElement('nav', {}, '이전 글'), actions: React.createElement('button', {}, '목록'),
}));
for (const text of ['검증된 본문', '이전 글', '목록', 'value', '작성자', '&lt;script&gt;', 'blog-reading']) assert.ok(html.includes(text), text);
assert.ok(!fs.existsSync(new URL('../src/extensions/posts/blog/registry.tsx', import.meta.url)));
assert.ok(!html.includes('THE JOURNAL'));
assert.ok(!html.includes('emerald'));
let canWrite = true;
let writeButtonProps;
let navigatedTo;
let moduleDesc;
const BlogList = load('src/extensions/blog-skin/tpl/list.tsx', {
  'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
  'next/navigation': { useRouter: () => ({ push(url) { navigatedTo = url; } }), useSearchParams: () => new URLSearchParams() },
  '@/core/components/button/Button': { __esModule: true, default: (props) => { writeButtonProps = props; return React.createElement('button', { type: props.type }, props.children); } },
  '@/modules/posts/tpl/default/PostProvider': { usePostContext: () => ({ postInfo: { mid: 'blog', moduleName: '블로그', moduleDesc, categories: [] }, permissions: { doList: true, doWrite: canWrite } }) },
  '@/modules/posts/tpl/default/notPermission': { __esModule: true, default: () => null },
  '@/core/components/nav/PageNavigation': { __esModule: true, default: () => null },
  '@/core/utils/date/kst': { toKstDayjs: () => ({ format: () => '2026.09.16' }) },
}).default;
const pagination = { page: 1, totalPages: 1, totalCount: 1, listCount: 20 };
const listing = renderToStaticMarkup(React.createElement(BlogList, { pagination, posts: [{ id: 1, slug: 'test', title: '테스트', createdAt: '2026-09-15', isSecrets: true }] }));
for (const text of ['테스트', '/posts/blog/test', '글쓰기', '비밀글']) assert.ok(listing.includes(text), text);
assert.equal(writeButtonProps.type, 'button');
writeButtonProps.onClick();
assert.equal(navigatedTo, '/posts/blog/create');
assert.ok(!listing.includes('aria-label="블로그 분류"'));
assert.ok(!listing.includes('전체 글'));
const listHeader = listing.match(/<header[\s\S]*?<\/header>/)?.[0] || '';
assert.ok(!listHeader.includes('border-b'));
assert.ok(listHeader.includes('blog-wordmark'));
assert.ok(listHeader.includes('만들며 배운 것들, 그 과정의 기록.'));
assert.ok(listHeader.includes('aria-hidden="true"'));
moduleDesc = 'Configured blog introduction';
const configuredIntro = renderToStaticMarkup(React.createElement(BlogList, { pagination, posts: [] }));
assert.ok(configuredIntro.includes(moduleDesc));
assert.ok(!configuredIntro.includes('만들며 배운 것들, 그 과정의 기록.'));
moduleDesc = undefined;
canWrite = false;
assert.ok(!renderToStaticMarkup(React.createElement(BlogList, { pagination, posts: [] })).includes('글쓰기'));
canWrite = true;
assert.ok(!listing.includes('THE JOURNAL'));
assert.ok(!listing.includes('<img'));
assert.ok(listing.includes('md:grid-cols-2'));
assert.ok(listing.includes('lg:grid-cols-3'));
assert.ok(listing.includes('content-start items-start'));
assert.ok(!listing.includes('group flex h-full'));
assert.ok(!listing.includes('mt-auto'));
assert.ok(listing.includes('aspect-[8/5]'));
assert.ok(!listing.includes('backdrop-blur'));
assert.ok(listing.includes('blog-featured min-w-0 md:col-span-2'));
assert.ok(listing.includes('text-2xl leading-8'));
assert.ok(listing.includes('tracking-normal'));
assert.ok(html.includes('링크 복사'));
const readWithCover = renderToStaticMarkup(React.createElement(BlogRead, {
  document: { title: '대표 이미지 글', createdAt: '2026-09-16', thumbnail: '/read-cover.jpg' },
  postInfo: { mid: 'blog', moduleName: '블로그' }, content: '본문', navigation: null, actions: null,
}));
assert.ok(readWithCover.includes('src="/read-cover.jpg"'));
assert.ok(readWithCover.includes('text-center'));
assert.ok(readWithCover.includes('blog-cover aspect-[1.9/1] w-full overflow-hidden rounded-2xl'));
assert.ok(listing.includes('sm:aspect-[2/1] w-full shrink-0 overflow-hidden rounded-2xl'));
assert.ok(readWithCover.includes('blog-article mx-auto w-full max-w-screen-xl'));
const introAfterEmptyParagraph = renderToStaticMarkup(React.createElement(BlogRead, {
  document: { createdAt: '2026-09-16', content: JSON.stringify({ type: 'doc', content: [
    { type: 'paragraph' },
    { type: 'image', attrs: { src: '/cover.png' } },
    { type: 'paragraph', content: [{ type: 'text', text: '   ' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Restored introduction' }] },
  ] }) },
  postInfo: { mid: 'blog', moduleName: 'Blog' }, content: null, navigation: null, actions: null,
}));
assert.ok(introAfterEmptyParagraph.includes('Restored introduction'));
const withCover = renderToStaticMarkup(React.createElement(BlogList, { pagination, posts: [{ id: 2, slug: 'cover', title: '표지 글', createdAt: '2026-09-15', thumbnail: '/test-cover.jpg' }] }));
assert.ok(withCover.includes('src="/test-cover.jpg"'));
assert.ok(withCover.includes('loading="eager"'));
const laterPage = renderToStaticMarkup(React.createElement(BlogList, { pagination: { ...pagination, page: 2 }, posts: [{ id: 3, slug: 'later', title: 'Later', createdAt: '2026-09-15', thumbnail: '/later.jpg' }] }));
assert.ok(!laterPage.includes('blog-featured'));
assert.ok(laterPage.includes('loading="lazy"'));
assert.ok(renderToStaticMarkup(React.createElement(BlogList, { pagination, posts: [] })).includes('등록된 글이 없습니다.'));
console.log('blog skin: independent path, list/read registry, fallback, escaped title, content and navigation slots passed');
