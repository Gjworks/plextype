// Plextype 코어 배포본을 만들어 Store에 올린다. 쉬운 설치의 코어 업데이트(src/modules/installer/lib/coreUpdate.ts)가 받는 파일이다.
// 원본 저장소의 릴리스 워크플로(.github/workflows/sync-to-plextype.yml)가 배포판으로 걸러 낸 체크아웃에서 실행한다.
//
//   node scripts/publish-core.mjs                 Store에 올린다
//   node scripts/publish-core.mjs --out core.zip  올리지 않고 파일로만 만든다
//
// 올릴 때 읽는 환경 변수:
//   PLEXTYPE_STORE_URL        Store 주소 (없으면 https://gjworks.dev)
//   STORE_CORE_PUBLISH_TOKEN  Store 서버의 같은 이름 환경 변수와 같은 값
//
// 배포본에는 마지막 커밋(HEAD)의 파일 가운데 코어의 것만 들어간다. 작업 폴더가 아닌 커밋에서 읽으므로, 빌드가 고친 파일이나
// 커밋하지 않은 수정이 섞이지 않고 git으로 나가는 배포판과 같은 내용이 된다. 프로젝트의 것과 다시 만드는 결과물을 빼는 규칙은
// coreUpdate.ts의 isExcludedFromCore 하나이고, Store와 설치기도 같은 규칙으로 검사한다.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { crc32, deflateRawSync } from 'node:zlib';

const core = await import('../src/modules/installer/lib/coreUpdate.ts');

// 배포본에 넣을 파일의 경로. 정렬되어 있어 같은 커밋에서는 같은 ZIP이 나온다.
export function listCoreFiles(root) {
  // 한 줄은 "<모드> <종류> <해시>\t<경로>"다.
  const entries = execFileSync('git', ['ls-tree', '-r', '-z', 'HEAD'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean)
    .map((line) => ({ mode: line.slice(0, 6), file: line.slice(line.indexOf('\t') + 1) }))
    .filter((entry) => !core.isExcludedFromCore(entry.file));
  for (const { mode, file } of entries) {
    // 조용히 빠지면 받는 쪽에서 파일이 모자라게 되므로, 넣을 수 없는 경로는 여기서 멈춘다.
    if (!core.isCoreReleasePath(file)) throw new Error(`Cannot put this path in a core release: ${file}`);
    // 100644와 100755만 일반 파일이다. 링크(120000)와 서브모듈(160000)은 받는 쪽이 받지 않는다.
    if (!mode.startsWith('100')) throw new Error(`Not a regular file: ${file}`);
  }
  return entries.map((entry) => entry.file).sort();
}

// 마지막 커밋에 든 파일의 내용.
export const readCommitted = (root) => (file) => execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 });

// 설치기와 Store가 읽는 범위의 ZIP: deflate, UTF-8 이름, ZIP64 없음. 시각을 적지 않아 내용이 같으면 바이트도 같다.
// read는 경로를 받아 그 파일의 내용을 돌려준다.
export function buildCoreZip(files, read) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const file of files) {
    const content = read(file);
    const name = Buffer.from(file);
    const data = deflateRawSync(content, { level: 9 });
    const checksum = crc32(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8);
    local.writeUInt32LE(checksum, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(content.length, 22); local.writeUInt16LE(name.length, 26);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(20, 6); header.writeUInt16LE(0x0800, 8); header.writeUInt16LE(8, 10);
    header.writeUInt32LE(checksum, 16); header.writeUInt32LE(data.length, 20); header.writeUInt32LE(content.length, 24); header.writeUInt16LE(name.length, 28);
    header.writeUInt32LE(offset, 42);
    locals.push(local, name, data);
    central.push(header, name);
    offset += 30 + name.length + data.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

export async function publishCore(root, { storeUrl, token }) {
  const read = readCommitted(root);
  const { version } = JSON.parse(read(core.CORE_VERSION_FILE).toString('utf8'));
  const zip = buildCoreZip(listCoreFiles(root), read);
  const target = new URL('/api/store/core', storeUrl);
  const response = await fetch(target, {
    method: 'POST',
    // Store 서버는 상태를 바꾸는 요청의 출처를 검사한다(src/core/proxy/defaultProxy.ts). 그 검사는 로그인 쿠키를 가진
    // 브라우저를 다른 사이트가 움직이는 것을 막기 위한 것이고, 이 요청은 쿠키가 아닌 등록 토큰으로 확인되므로 Store 자신의 출처를 밝힌다.
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/zip', Origin: target.origin },
    body: zip,
    redirect: 'error',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Store rejected the core release (${response.status}): ${body.error ?? 'no reason given'}`);
  // Store는 ZIP 안의 버전 파일로 버전을 정한다. 올리려던 버전과 다르면 배포본을 잘못 만든 것이다.
  if (body.version !== version) throw new Error(`Store registered ${body.version}, expected ${version}.`);
  return { version, size: zip.length, created: body.created === true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = process.cwd();
  const out = process.argv.indexOf('--out');
  if (out >= 0) {
    const files = listCoreFiles(root);
    fs.writeFileSync(process.argv[out + 1], buildCoreZip(files, readCommitted(root)));
    console.log(`Wrote ${files.length} core files to ${process.argv[out + 1]}.`);
  } else {
    if (!process.env.STORE_CORE_PUBLISH_TOKEN) throw new Error('STORE_CORE_PUBLISH_TOKEN is required.');
    const result = await publishCore(root, { storeUrl: process.env.PLEXTYPE_STORE_URL || 'https://gjworks.dev', token: process.env.STORE_CORE_PUBLISH_TOKEN });
    console.log(`${result.created ? 'Published' : 'Already published'} Plextype core ${result.version} (${result.size} bytes).`);
  }
}
