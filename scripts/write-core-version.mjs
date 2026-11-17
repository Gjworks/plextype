// release-it의 after:bump hook이 부른다. 릴리스 버전을 src/core/plextype.json에 적는다.
// package.json의 version은 각 프로젝트의 앱 버전이라 릴리스에서 바꾸지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function writeCoreVersion(root, version) {
  if (!versionPattern.test(version ?? '')) throw new Error(`Invalid version: ${version}`);
  const file = path.join(root, 'src/core/plextype.json');
  const current = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, `${JSON.stringify({ ...current, version }, null, 2)}\n`);
  return file;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  writeCoreVersion(process.cwd(), process.argv[2]);
  console.log(`Plextype core version: ${process.argv[2]}`);
}
