// npm run build 전에(prebuild) src/extensions/package.json의 패키지가 설치되어 있는지 확인하고, 빠져 있으면 설치한다.
// Dockerfile이 루트 package.json만 복사해 npm install을 하면 workspace인 src/extensions/package.json이 빠져
// 프로젝트 전용 패키지가 설치되지 않는다. 그런 Dockerfile을 고치지 않아도 빌드되도록 여기서 한 번 더 설치한다.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function findMissingWorkspaceDeps(root) {
  const manifest = path.join(root, 'src/extensions/package.json');
  if (!fs.existsSync(manifest)) return [];
  const { dependencies = {} } = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  return Object.keys(dependencies).filter(name =>
    !fs.existsSync(path.join(root, 'node_modules', name, 'package.json')) &&
    !fs.existsSync(path.join(root, 'src/extensions/node_modules', name, 'package.json')));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = process.cwd();
  let missing = findMissingWorkspaceDeps(root);
  if (missing.length) {
    console.log(`src/extensions/package.json의 패키지가 설치되지 않아 npm install을 실행합니다: ${missing.join(', ')}`);
    spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: root, stdio: 'inherit' });
    missing = findMissingWorkspaceDeps(root);
  }
  if (missing.length) {
    console.error(`src/extensions/package.json의 패키지를 설치하지 못했습니다: ${missing.join(', ')}`);
    console.error('소스 전체가 있는 상태에서 npm install이 되는지 확인하세요.');
    process.exit(1);
  }
}
