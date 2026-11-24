// Store의 확장 패키지를 명령 줄에서 설치한다. 관리자 화면의 쉬운 설치와 같은 로직(src/modules/installer/lib/storeInstall.ts)을 쓴다.
// 관리자 화면을 두지 않은 프로젝트에서도 쓸 수 있다. 프로젝트 루트에서 실행한다.
//
//   npm run plextype -- connect [--store <주소>]   액세스 토큰으로 Store에 연결 (토큰은 PLEXTYPE_STORE_TOKEN 또는 입력)
//   npm run plextype -- status                      연결 상태
//   npm run plextype -- list                        설치할 수 있는 자료
//   npm run plextype -- install <패키지ID|상품UUID> 설치 또는 업데이트
//   npm run plextype -- remove <패키지ID>           제거 (.plextype/backup으로 옮김)
//   npm run plextype -- keys                        서명 검증 키 다시 받기
//   npm run plextype -- disconnect                  연결 해제
//
// TypeScript 소스를 Node가 직접 읽으므로 Node 22.18 이상이 필요하다.
import readline from 'node:readline/promises';
import process from 'node:process';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 18)) {
  console.error(`Node 22.18 이상이 필요합니다. 현재 버전: ${process.versions.node}`);
  process.exit(1);
}

const lib = await import('../src/modules/installer/lib/storeInstall.ts');
const root = process.cwd();
const [command, ...rest] = process.argv.slice(2);

const option = (name) => {
  const index = rest.indexOf(name);
  return index >= 0 ? rest[index + 1] : undefined;
};

const requireConnection = async () => {
  const connection = await lib.readConnection(root);
  if (!connection) throw new lib.InstallerError('먼저 Store에 연결해주세요: npm run plextype -- connect');
  return connection;
};

const afterInstall = (result) => {
  console.log(`${result.previousVersion ? `업데이트했습니다 (${result.previousVersion} → ${result.version})` : `설치했습니다 (${result.version})`}: ${result.installPath}`);
  if (result.routes.length) console.log(`연결한 라우트 ${result.routes.length}개:\n${result.routes.map((route) => `  ${route}`).join('\n')}`);
  console.log('\n다음 할 일');
  console.log('  - 관리자 메뉴나 스킨을 제공하는 패키지는 src/extensions/registry.tsx에 등록합니다.');
  if (result.requiresDatabaseReview) console.log('  - DB 변경 파일이 들어 있습니다. 내용을 검토한 뒤 npm run prisma:generate 와 마이그레이션을 직접 실행합니다.');
  console.log('  - 동작을 확인한 뒤 커밋하고 배포합니다.');
};

const commands = {
  async connect() {
    const store = option('--store') || lib.DEFAULT_STORE_URL;
    let token = process.env.PLEXTYPE_STORE_TOKEN;
    if (!token) {
      const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
      token = await prompt.question(`${store}의 액세스 토큰: `);
      prompt.close();
    }
    const connection = await lib.connectStore(root, store, token || '');
    console.log(`연결했습니다: ${connection.storeUrl} (${connection.accountName || '계정'} · ${connection.tokenName || '토큰'})`);
    console.log(`서명 검증 키 ${connection.keys.length}개를 보관했습니다.`);
  },
  async status() {
    const connection = await lib.readConnection(root);
    console.log(`Plextype ${await lib.readPlatformVersion(root)}`);
    console.log(connection
      ? `Store: ${connection.storeUrl} (${connection.accountName || '계정'} · ${connection.tokenName || '토큰'}), 서명 키 ${connection.keys.length}개`
      : 'Store: 연결 안 됨');
  },
  async list() {
    const connection = await lib.readConnection(root);
    const products = await lib.fetchCatalog(option('--store') || connection?.storeUrl || lib.DEFAULT_STORE_URL);
    if (!products.length) return console.log('설치할 수 있는 자료가 없습니다.');
    for (const product of products) {
      console.log(`${product.packageId}@${product.version}  ${product.name}  (${product.sellerName}, ${product.licenseType || '라이선스 미표기'})`);
    }
  },
  async install() {
    const name = rest.find((value) => !value.startsWith('--'));
    if (!name) throw new lib.InstallerError('설치할 패키지 ID를 적어주세요: npm run plextype -- install <패키지ID>');
    const connection = await requireConnection();
    const products = await lib.fetchCatalog(connection.storeUrl);
    const product = products.find((item) => item.packageId === name || item.productUuid === name);
    if (!product) throw new lib.InstallerError(`Store에서 "${name}" 자료를 찾지 못했습니다. npm run plextype -- list 로 확인해주세요.`);
    afterInstall(await lib.installStorePackage(root, product.productUuid));
  },
  async remove() {
    const name = rest.find((value) => !value.startsWith('--'));
    if (!name) throw new lib.InstallerError('제거할 패키지 ID를 적어주세요: npm run plextype -- remove <패키지ID>');
    const result = await lib.uninstallStorePackage(root, name);
    console.log(`제거했습니다: ${result.packageId} ${result.version}`);
    console.log(`폴더는 ${result.backupPath}로 옮겼습니다. src/extensions/registry.tsx에 등록했다면 그 줄도 지워주세요.`);
  },
  async keys() {
    const connection = await lib.refreshStoreKeys(root);
    console.log(`서명 검증 키 ${connection.keys.length}개를 보관했습니다.`);
  },
  async disconnect() {
    await lib.disconnectStore(root);
    console.log('연결을 해제했습니다. Store의 토큰 자체를 없애려면 Store의 액세스 토큰 화면에서 삭제합니다.');
  },
};

if (!command || !commands[command]) {
  console.log('사용법: npm run plextype -- <connect|status|list|install|remove|keys|disconnect>');
  process.exit(command ? 1 : 0);
}

try {
  await commands[command]();
} catch (error) {
  if (error instanceof lib.InstallerError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
