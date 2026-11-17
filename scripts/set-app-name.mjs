// package.json의 name을 프로젝트의 앱 이름으로 바꾼다. npm run setup이 부르고, 직접 실행할 수도 있다.
//   node scripts/set-app-name.mjs my-site
// 원본 저장소의 name은 배포판 기본값(plextype)이어야 하므로 원본에서는 바꾸지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isPlextypeSource } from './release.mjs';

const namePattern = /^[a-z0-9][a-z0-9._-]{0,213}$/;

// 바꿨으면 true. 원본 저장소이거나 이름이 이미 같으면 false.
export function setAppName(root, name) {
  if (!namePattern.test(name ?? '')) {
    throw new Error(`Invalid app name: ${name}. Use lowercase letters, digits, ".", "_" and "-", starting with a letter or digit.`);
  }
  if (isPlextypeSource(root)) return false;
  const file = path.join(root, 'package.json');
  const text = fs.readFileSync(file, 'utf8');
  // 최상위 name은 파일의 첫 "name" 항목이다. 그 줄만 바꿔 나머지 서식을 유지한다.
  const next = text.replace(/^(\s*"name"\s*:\s*)"[^"]*"/m, `$1${JSON.stringify(name)}`);
  if (JSON.parse(next).name !== name) throw new Error('package.json has no top-level name to replace.');
  if (next === text) return false;
  fs.writeFileSync(file, next);
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const changed = setAppName(process.cwd(), process.argv[2]);
  console.log(changed ? `package.json name: ${process.argv[2]}` : 'package.json name unchanged.');
}
