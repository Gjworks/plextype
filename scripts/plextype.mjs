// Store의 확장 패키지를 명령 줄에서 설치한다. 관리자 화면의 쉬운 설치와 같은 로직(src/modules/installer/lib/storeInstall.ts)을 쓴다.
// 관리자 화면을 두지 않은 프로젝트에서도 쓸 수 있다. 프로젝트 루트에서 실행한다.
//
//   npm run plextype -- connect [--store <주소>]   액세스 토큰으로 Store에 연결 (토큰은 PLEXTYPE_STORE_TOKEN 또는 입력)
//   npm run plextype -- status                      연결 상태
//   npm run plextype -- list                        설치할 수 있는 자료
//   npm run plextype -- install <패키지ID|상품UUID> 설치 또는 업데이트 (DB 변경이 있으면 내용을 보여 주고 묻는다. --yes로 묻지 않음)
//   npm run plextype -- migrate                     설치한 패키지의 스키마를 합치고 마이그레이션을 개발 DB에 적용
//   npm run plextype -- remove <패키지ID>           제거 (.plextype/backup으로 옮김)
//   npm run plextype -- adopt <패키지ID>            패키지를 src/extensions로 옮겨 직접 고쳐 쓰는 내 확장으로 만들기
//   npm run plextype -- reference <패키지ID>        가져온 패키지의 새 버전을 비교용으로 받기 (.plextype/reference)
//   npm run plextype -- mark <패키지ID> <버전>      새 버전을 반영한 뒤 가져온 확장의 기준 버전 올리기
//   npm run plextype -- discard <패키지ID>          가져오기 취소 (고쳐 쓰던 폴더를 .plextype/backup으로 옮김)
//   npm run plextype -- core                        Plextype 코어를 Store의 새 배포본으로 올리기 (바뀔 내용을 보여 주고 묻는다.
//                                                   --yes는 묻지 않고 고친 파일을 둔 채 적용, --yes --overwrite는 묻지 않고 충돌하는 파일을 새 버전으로 덮어씀,
//                                                   --install은 이어서 npm install과 DB 적용까지 실행)
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
const database = await import('../src/modules/installer/lib/applyDatabase.ts');
const core = await import('../src/modules/installer/lib/coreUpdate.ts');
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

const ask = async (question) => {
  if (rest.includes('--yes')) return true;
  // 입력을 받을 수 없는 곳(스크립트, CI)에서는 묻지 못하므로 적용하지 않는다.
  if (!process.stdin.isTTY) return false;
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question(`${question} (y/N) `);
  prompt.close();
  return /^y(es)?$/i.test(answer.trim());
};

const applyDatabase = async () => {
  console.log('스키마를 합치고 마이그레이션을 적용합니다...');
  const result = await database.applyPackageDatabase(root);
  if (!result.applied) throw database.describeDatabaseFailure(result);
  console.log('DB에 적용했습니다. 패키지가 새 Prisma 모델을 쓴다면 개발 서버를 다시 시작해야 동작합니다.');
};

const afterInstall = (result) => {
  console.log(`${result.previousVersion ? `업데이트했습니다 (${result.previousVersion} → ${result.version})` : `설치했습니다 (${result.version})`}: ${result.installPath}`);
  if (result.alsoInstalled.length) console.log(`함께 설치했습니다: ${result.alsoInstalled.map((item) => `${item.packageId}@${item.version}`).join(', ')}`);
  if (result.routes.length) console.log(`연결한 라우트 ${result.routes.length}개:\n${result.routes.map((route) => `  ${route}`).join('\n')}`);
  console.log('\n다음 할 일');
  if (result.registered) console.log('  - 패키지의 관리자 메뉴와 스킨을 등록했습니다(src/packages/index.ts).');
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
    const adopted = new Map((await lib.listAdoptedPackages(root)).map((item) => [item.packageId, item.version]));
    for (const product of products) {
      const base = adopted.get(product.packageId);
      const notes = [
        base ? `내 확장으로 가져옴(${base} 기준)` : '',
        base && lib.compareVersions(product.version, base) > 0 ? '새 버전 있음' : '',
        base && product.securityVersions.some((version) => lib.compareVersions(version, base) > 0) ? '보안 패치 있음' : '',
      ].filter(Boolean).join(', ');
      console.log(`${product.packageId}@${product.version}  ${product.name}  (${product.sellerName}, ${product.licenseType || '라이선스 미표기'})${notes ? `  [${notes}]` : ''}`);
    }
  },
  async install() {
    const name = rest.find((value) => !value.startsWith('--'));
    if (!name) throw new lib.InstallerError('설치할 패키지 ID를 적어주세요: npm run plextype -- install <패키지ID>');
    const connection = await requireConnection();
    const products = await lib.fetchCatalog(connection.storeUrl);
    const product = products.find((item) => item.packageId === name || item.productUuid === name);
    if (!product) throw new lib.InstallerError(`Store에서 "${name}" 자료를 찾지 못했습니다. npm run plextype -- list 로 확인해주세요.`);
    const preview = await lib.previewStorePackage(root, product.productUuid);
    console.log(`${preview.packageId} ${preview.version} 설치 전 점검`);
    console.log(`  Node ${preview.node.current}${preview.node.required ? ` (${preview.node.required} 이상 필요)` : ''}`);
    if (preview.blockers.length) {
      throw new lib.InstallerError(`설치할 수 없습니다.\n${preview.blockers.map((reason) => `  - ${reason}`).join('\n')}`);
    }
    if (preview.alsoInstalls.length) {
      console.log(`  함께 설치되는 패키지: ${preview.alsoInstalls.map((item) => `${item.packageId}@${item.version}`).join(', ')}`);
    }
    let overwrite = false;
    if (preview.localChanges.length) {
      console.log('  직접 고친 파일이 있습니다. 업데이트하면 이 수정이 사라집니다(이전 폴더는 .plextype/backup에 보관).');
      for (const changed of preview.localChanges) {
        for (const file of changed.files) console.log(`    ${changed.packageId}: ${file.change} ${file.path}`);
      }
      overwrite = await ask('  덮어쓰고 업데이트할까요? 수정을 유지하려면 n을 누르고 adopt 명령으로 가져오세요.');
      if (!overwrite) throw new lib.InstallerError('업데이트하지 않았습니다.');
    }
    for (const conflict of preview.npm.conflicts) {
      console.log(`  주의: ${conflict.name}은(는) 프로젝트에 ${conflict.installed}가 있고 이 패키지는 ${conflict.range}를 요구합니다.`);
    }
    let apply = false;
    if (preview.hasDatabaseFiles) {
      console.log('  DB를 바꿉니다.');
      for (const migration of preview.migrations) {
        console.log(`\n--- ${migration.packageId} · ${migration.name} ---\n${migration.sql}${migration.truncated ? '\n-- 이하 생략' : ''}`);
      }
      if (!preview.migrations.length) console.log('  새로 적용할 마이그레이션은 없고 스키마 파일만 들어 있습니다.');
      apply = await ask('\n설치하고 개발 DB에 적용할까요?');
    }
    const expected = Object.fromEntries([...preview.alsoInstalls, preview].map((item) => [item.packageId, item.versionUuid]));
    const result = await lib.installStorePackage(root, product.productUuid, { versionUuid: preview.versionUuid, expected, overwriteLocalChanges: overwrite });
    afterInstall(result);
    if (apply) await applyDatabase();
    else if (preview.hasDatabaseFiles) console.log('\nDB에는 적용하지 않았습니다. 준비되면 npm run plextype -- migrate 를 실행해주세요.');
    if (preview.npm.command) console.log(`\n프로젝트에 없는 npm 라이브러리가 있습니다. 직접 실행해주세요:\n  ${preview.npm.command}`);
  },
  async remove() {
    const name = rest.find((value) => !value.startsWith('--'));
    if (!name) throw new lib.InstallerError('제거할 패키지 ID를 적어주세요: npm run plextype -- remove <패키지ID>');
    const result = await lib.uninstallStorePackage(root, name);
    console.log(`제거했습니다: ${result.packageId} ${result.version}`);
    console.log(`폴더는 ${result.backupPath}로 옮겼습니다.`);
    if (result.migrations.length) {
      await database.syncPackageSchema(root);
      console.log('이 패키지가 만든 테이블과 마이그레이션 적용 이력은 DB에 남아 있습니다. 필요 없으면 테이블을 직접 정리해주세요.');
    }
  },
  async adopt() {
    const name = rest.find((value) => !value.startsWith('--'));
    if (!name) throw new lib.InstallerError('가져올 패키지 ID를 적어주세요: npm run plextype -- adopt <패키지ID>');
    const result = await lib.adoptStorePackage(root, name);
    console.log(`가져왔습니다: ${result.path} (${result.version} 기준)`);
    console.log('이제 직접 고쳐 쓸 수 있습니다. 새 버전은 버튼으로 받을 수 없고, reference 명령으로 받아 직접 반영합니다.');
    console.log(`가져온 시점의 사본: ${result.referencePath}${result.hadLocalChanges ? ' (가져오기 전에 고친 파일이 있어 Store의 원본과 다릅니다)' : ''}`);
  },
  async reference() {
    const name = rest.find((value) => !value.startsWith('--'));
    if (!name) throw new lib.InstallerError('패키지 ID를 적어주세요: npm run plextype -- reference <패키지ID>');
    const connection = await requireConnection();
    const product = (await lib.fetchCatalog(connection.storeUrl)).find((item) => item.packageId === name || item.productUuid === name);
    if (!product) throw new lib.InstallerError(`Store에서 "${name}" 자료를 찾지 못했습니다.`);
    const result = await lib.downloadReferencePackage(root, product.productUuid);
    console.log(`${result.packageId} ${result.version}을(를) ${result.referencePath}에 받았습니다.`);
    if (result.basePath) console.log(`바뀐 내용 보기:\n  git diff --no-index ${result.basePath} ${result.referencePath}`);
    console.log(`반영을 마치면: npm run plextype -- mark ${result.packageId} ${result.version}`);
  },
  async mark() {
    const [name, version] = rest.filter((value) => !value.startsWith('--'));
    if (!name || !version) throw new lib.InstallerError('사용법: npm run plextype -- mark <패키지ID> <버전>');
    const result = await lib.markAdoptedVersion(root, name, version);
    console.log(`${result.packageId}의 기준 버전을 ${result.version}으로 올렸습니다.`);
  },
  async discard() {
    const name = rest.find((value) => !value.startsWith('--'));
    if (!name) throw new lib.InstallerError('패키지 ID를 적어주세요: npm run plextype -- discard <패키지ID>');
    const result = await lib.discardAdoptedPackage(root, name);
    console.log(`가져오기를 취소했습니다. 고쳐 쓰던 폴더는 ${result.backupPath}로 옮겼습니다.`);
  },
  async migrate() {
    await applyDatabase();
  },
  async core() {
    await requireConnection();
    const preview = await core.previewCoreUpdate(root);
    console.log(`Plextype ${preview.currentVersion} → ${preview.version}`);
    console.log(`  파일 ${preview.writes.length}개를 쓰고 ${preview.removes.length}개를 지웁니다. 바뀌거나 지워지는 파일은 .plextype/backup에 보관합니다.`);
    if (preview.blockers.length) {
      throw new lib.InstallerError(`적용할 수 없습니다.\n${preview.blockers.map((reason) => `  - ${reason}`).join('\n')}`);
    }
    if (preview.kept.length) console.log(`  직접 고쳤지만 새 버전에서 바뀌지 않아 그대로 두는 파일 ${preview.kept.length}개`);
    if (preview.dependencies.length) console.log(`  버전이 달라지는 npm 라이브러리: ${preview.dependencies.join(', ')}`);
    if (preview.migrations.length) console.log(`  새 코어 마이그레이션: ${preview.migrations.join(', ')}`);
    let conflicts;
    if (preview.conflicts.length) {
      if (preview.hasBaseline) {
        console.log('  직접 고친 파일이 새 버전과 충돌합니다.');
        for (const file of preview.conflicts) console.log(`    ${file.kind} ${file.path}`);
        conflicts = rest.includes('--overwrite') || (!rest.includes('--yes') && await ask('  충돌하는 파일을 새 버전으로 덮어쓸까요? n을 누르면 내 파일을 두고 새 버전의 내용을 .plextype/reference에 받습니다.'))
          ? 'overwrite' : 'keep';
      } else {
        console.log(`  Store에 Plextype ${preview.currentVersion}의 배포본이 없어 직접 고친 파일을 가려낼 수 없습니다. 내용이 다른 파일 ${preview.conflicts.length}개가 모두 새 버전으로 바뀝니다.`);
        // --yes는 고친 파일을 두겠다는 뜻이라 여기서는 통하지 않는다. 모두 바꾸는 것은 직접 답하거나 --overwrite로 밝혀야 한다.
        const agreed = rest.includes('--overwrite') || (!rest.includes('--yes') && await ask('  모두 바꾸고 적용할까요?'));
        if (!agreed) throw new lib.InstallerError('적용하지 않았습니다. 묻지 않고 모두 바꾸려면 --yes --overwrite를 붙입니다.');
        conflicts = 'overwrite';
      }
    }
    if (!(await ask(`${preview.version}을(를) 적용할까요?`))) throw new lib.InstallerError('적용하지 않았습니다.');
    const result = await core.applyCoreUpdate(root, { version: preview.version, sha256: preview.sha256, conflicts });
    console.log(`적용했습니다 (${result.previousVersion} → ${result.version}): 파일 ${result.written}개를 쓰고 ${result.removed}개를 지웠습니다.`);
    if (result.backupPath) console.log(`바뀌기 전의 파일: ${result.backupPath}`);
    let finished = false;
    if (rest.includes('--install')) {
      console.log('npm install과 DB 적용을 실행합니다. 몇 분 걸릴 수 있습니다...');
      const finish = await database.finishCoreUpdate(root, result);
      if (finish.ran.length) console.log(`실행했습니다: ${finish.ran.join(', ')}`);
      if (!finish.completed) {
        throw new lib.InstallerError(`${finish.remaining[0]} 실행 중 실패했습니다.\n${finish.output}\n\n코어 파일은 ${result.version}으로 바뀐 상태입니다. 원인을 고친 뒤 이어서 실행해주세요: ${finish.remaining.join(', ')}`);
      }
      finished = true;
    }
    console.log(`\n다음 할 일\n${core.coreUpdateNextSteps(result, { finished }).map((step) => `  - ${step}`).join('\n')}`);
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
  console.log('사용법: npm run plextype -- <connect|status|list|install|migrate|core|remove|adopt|reference|mark|discard|keys|disconnect>');
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
