import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const fallbacks = {
  'page.tsx': 'import { DefaultLayout, HomePage } from "@extensions";\n\nexport default function Page() {\n  return <DefaultLayout><HomePage /></DefaultLayout>;\n}\n',
  '(modules)/user/notifications/page.tsx': 'export { default } from "@/modules/notification/tpl/UserNotificationsPage";\n',
};

// 배포본의 src/packages 목록 파일. 쉬운 설치(src/modules/installer/lib/storeInstall.ts의 writePackageRegistry)가
// 설치된 패키지가 없을 때 만드는 내용과 같다. 코어가 이 파일들을 직접 가져다 쓰므로 패키지를 지워도 파일은 있어야 한다.
const GENERATED_NOTE = '// 쉬운 설치가 만드는 파일. 직접 고치지 않는다. 패키지를 설치·제거하거나 내 확장으로 가져올 때마다 다시 만든다.';
const emptyPackageLists = {
  'index.ts': ['import type { ExtensionRegistryConfig } from "@/core/registry/define";', 'export const installedPackages: ExtensionRegistryConfig[]'],
  'installedTriggers.ts': ['import type { PackageTriggers } from "@/core/utils/trigger/define";', 'export const installedTriggers: PackageTriggers[]'],
  'installedLoginProviders.ts': ['import type { LoginProviderSource } from "@/core/registry/defineLoginProviders";', 'export const installedLoginProviders: LoginProviderSource[]'],
  'installedSocialProviders.ts': ['import type { ProviderDefinition } from "@/modules/user/social/providers";', 'export const installedSocialProviders: ProviderDefinition[][]'],
};

// 원본 프로젝트가 설치했거나 직접 개발하는 패키지는 배포본에 넣지 않는다. 받는 쪽이 쉬운 설치로 직접 넣는다.
// 패키지 폴더를 지우고 목록 파일을 빈 목록으로 되돌린다. 지운 폴더 이름을 돌려준다.
function removeInstalledPackages(root) {
  const directory = path.join(root, 'src/packages');
  const removed = [];
  if (fs.existsSync(directory)) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      fs.rmSync(path.join(directory, entry.name), { recursive: true, force: true });
      removed.push(entry.name);
    }
  }
  fs.mkdirSync(directory, { recursive: true });
  for (const [name, [typeImport, declaration]] of Object.entries(emptyPackageLists)) {
    fs.writeFileSync(path.join(directory, name), [GENERATED_NOTE, typeImport, '', `${declaration} = [];`, ''].join('\n'));
  }
  return removed;
}

// Only run in the filtered distribution, never in the source checkout.
export function preparePlextype(root) {
  if (fs.existsSync(path.join(root, 'src/extensions'))) {
    throw new Error('Remove extensions in a distribution checkout before preparing Plextype.');
  }
  const packages = removeInstalledPackages(root);
  const app = path.join(root, 'src/app');
  const removed = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        const content = fs.readFileSync(file, 'utf8');
        if ((content.startsWith('// Extension-owned implementation;') ||
             content.startsWith('// Implementation is owned by Store;')) &&
            // 연결 파일이 가리키는 구현은 확장(src/extensions)이나 설치 패키지(src/packages)에 있고, 둘 다 배포본에 없다.
            (content.includes('from "@/extensions/') || content.includes('from "@/packages/'))) {
          fs.unlinkSync(file);
          removed.push(path.relative(app, file));
        }
      }
    }
  }
  visit(app);
  for (const [route, content] of Object.entries(fallbacks)) {
    const file = path.join(app, route);
    if (fs.existsSync(file)) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  console.log(`Prepared Plextype: removed ${removed.length} extension route adapters and ${packages.length} installed packages.`);
  return removed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  preparePlextype(process.cwd());
}
