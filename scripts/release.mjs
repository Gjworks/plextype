// npm run release의 진입점. 저장소 종류에 맞는 release-it 설정을 고른다.
// - Plextype 원본 저장소: .release-it.plextype.json. 코어 버전(src/core/plextype.json)과 CHANGELOG.md를 올린다.
// - 배포판을 받아 만든 프로젝트: .release-it.json. 앱 버전(package.json)과 CHANGELOG.project.md를 올린다.
// 원본 저장소는 배포판으로 나가지 않는 동기화 워크플로 파일이 있는지로 구분한다.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const sourceMarker = '.github/workflows/sync-to-plextype.yml';

export function isPlextypeSource(root) {
  return fs.existsSync(path.join(root, sourceMarker));
}

export function releaseArgs(root, args = []) {
  return isPlextypeSource(root) ? ['--config', '.release-it.plextype.json', ...args] : [...args];
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = spawnSync('npx', ['release-it', ...releaseArgs(process.cwd(), process.argv.slice(2))], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
