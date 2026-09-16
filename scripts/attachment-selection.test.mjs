import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const states = [];
let cursor = 0;
const react = {
  ...require('react'),
  useEffect() {},
  useMemo: (fn) => fn(),
  useState(initial) {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
  },
};
const List = () => null;
const Upload = () => null;
const Files = () => null;
const mocks = {
  react,
  '@/modules/attachment/tpl/default/AttachmentList': { default: List },
  '@/modules/attachment/tpl/default/myFiles': { default: Files },
  '@components/editor/UploadFileManager': { default: Upload },
  '@components/modal/Popup': { default: () => null },
  '@components/button/Button': { default: () => null },
  '@/modules/attachment/actions/attachment.action': { getAttachmentsAction: async () => ({ success: true, data: [] }) },
  '@/modules/attachment/lib/parser': { extractUploadPaths: () => [] },
};
for (const mock of Object.values(mocks)) if (mock.default) mock.__esModule = true;
const source = fs.readFileSync(new URL('../src/modules/attachment/index.tsx', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
const exports = {};
new Function('require', 'exports', output)((id) => mocks[id] ?? require(id), exports);
function find(node, type) {
  if (!node || typeof node !== 'object') return;
  if (node.type === type) return node;
  for (const child of [node.props?.children].flat()) {
    const match = find(child, type);
    if (match) return match;
  }
}
const inserted = [];
const attached = [];
const props = { content: '', autoInsertImages: false, onFileClick: (file) => inserted.push(file), onFileAttach: (file) => attached.push(file), onFileDelete() {} };
function render(extra = {}) {
  cursor = 0;
  return exports.Attachment.Box({ ...props, ...extra });
}
const image = { id: 1, uuid: 'image', path: '/uploads/image.png', originalName: 'image.png', mimeType: 'image/png', size: 10 };
find(render(), Upload).props.onFileClick(image);
assert.equal(inserted.length, 0, 'upload must not insert an image');
assert.equal(attached[0].name, 'image.png');
assert.equal(find(render(), List).props.attachments.length, 1);
find(render(), Files).props.onFileSelect({ ...image, name: 'image.png' });
assert.equal(inserted.length, 0, 'library selection must not insert an image');
assert.equal(find(render(), List).props.attachments.length, 1, 'selection is deduplicated');
find(render(), List).props.onFileClick(image);
assert.equal(inserted.length, 1, 'explicit insertion remains available');
find(render(), List).props.onDeleteRequest(image);
assert.equal(find(render(), List).props.attachments.length, 0);
find(render({ autoInsertImages: true }), Upload).props.onFileClick(image);
assert.equal(inserted.length, 2, 'other attachment consumers retain insertion');
states[0] = [{ ...image, name: 'image.png' }];
states[2] = [];
assert.equal(find(render({ selectedThumbnail: image.path }), List).props.attachments.length, 1, 'thumbnail is visible without a body image');
console.log('attachment selection: upload, library, explicit insertion, deduplication, removal, thumbnail and compatibility passed');
