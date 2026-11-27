// Store가 배포하는 Plextype 코어 배포본으로 이 프로젝트의 코어 파일을 새 버전으로 올리는 로직.
//
// `git merge upstream/main`을 쓰지 않는 프로젝트를 위한 길이다. 배포본은 코어 파일 전체의 스냅샷이고,
// 지금 버전의 배포본(기준)·새 버전의 배포본·프로젝트의 파일을 파일 단위로 견주어 바꿀 것을 정한다.
//
// | 프로젝트의 파일 | 새 버전 | 하는 일 |
// |---|---|---|
// | 기준과 같음 | 바뀜·삭제됨 | 새 버전대로 쓰거나 지운다 |
// | 기준과 다름(직접 고침) | 기준과 같음 | 그대로 둔다 |
// | 기준과 다름 | 바뀜·삭제됨 | 충돌. 그대로 둘지 덮어쓸지 사람이 정한다 |
//
// storeInstall.ts와 같은 이유로 Node 내장 모듈만 import하고 지워지는 타입 문법만 쓴다.
// 형식을 만드는 쪽(Store의 등록 API, scripts/publish-core.mjs)도 이 파일의 함수를 쓴다.

import { randomBytes } from "node:crypto";
import type { Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import {
  InstallerError,
  MAX_ENTRIES,
  MAX_PACKAGE_BYTES,
  MIGRATION_FILE,
  SHA256,
  STATE_DIRECTORY,
  VERSION,
  assertInstallAllowed,
  canonical,
  compareVersions,
  isRecord,
  isSafeRelativePath,
  readConnection,
  readPlatformVersion,
  readZipEntries,
  sha256,
  statePath,
  storeJson,
  storeRequest,
  verifyPackageSignature,
} from "./storeInstall.ts";
import type { SignedMetadata } from "./storeInstall.ts";
import { AGENTS_RULES_FILE, describeAgentsFile, previewAgentsFile, syncAgentsFile } from "./agentsFile.ts";
import type { AgentsFileResult, AgentsFileStatus } from "./agentsFile.ts";

export type CoreManifest = {
  schemaVersion: 1;
  type: "plextype-core";
  version: string;
  // 프로젝트 루트 기준 경로. 경로 순으로 정렬되어 있다.
  files: { path: string; size: number; sha256: string }[];
  // package.json에서 name과 version을 뺀 내용의 해시. 두 값은 프로젝트의 것이라 고친 것으로 치지 않는다.
  packageJsonCoreSha256: string;
};

type CoreMetadata = SignedMetadata & { manifest: CoreManifest };

export type CoreRelease = { version: string; size: number; releasedAt: string };

export const CORE_VERSION_FILE = "src/core/plextype.json";
const PACKAGE_JSON = "package.json";
// 원본 저장소에만 있는 파일. scripts/release.mjs의 sourceMarker와 같다.
const SOURCE_MARKER = ".github/workflows/sync-to-plextype.yml";

// 코어 배포본에 들어갈 수 없는 경로. 프로젝트의 것이거나, 프로젝트마다 다시 만드는 결과물이다.
// 대소문자를 구분하지 않는 파일 시스템에서는 SRC/extensions도 같은 폴더이므로 대소문자를 가리지 않고 견준다.
const EXCLUDED_PATHS = [
  // 프로젝트가 직접 만드는 확장과 그 라우트.
  /^src\/extensions\//i, /^src\/app\/\(extensions\)\//i, /^src\/app\/\(pages\)\//i,
  // 쉬운 설치가 넣은 패키지와, 설치기가 다시 만드는 등록 목록. 폴더 안내문만 코어의 것이다.
  /^src\/packages\/(?!README\.md$)/i,
  // scripts/sync-prisma.mjs와 prisma generate가 코어·확장·패키지를 합쳐 만드는 결과물.
  /^prisma\//i, /^src\/core\/utils\/db\/generated\//i,
  // 정적 자산. 로고·아이콘·배경처럼 프로젝트가 자기 것으로 바꾸는 파일이고, 용량이 커서 배포본 크기 제한을 넘긴다.
  // 코어가 새로 참조하는 자산은 프로젝트가 직접 넣어야 한다.
  /^public\//i,
  // 설치기의 상태 폴더, 업로드 파일, 프로젝트의 CI 설정.
  /^\.plextype\//i, /^storage\//i, /^\.github\//i,
];

export const isExcludedFromCore = (file: string) => EXCLUDED_PATHS.some((pattern) => pattern.test(file));
export const isCoreReleasePath = (file: string) => isSafeRelativePath(file) && !isExcludedFromCore(file);

// package.json을 고쳤는지 볼 때 쓰는 해시. 읽을 수 없는 내용이면 null.
export function packageJsonCoreSha256(content: Buffer) {
  try {
    const value = JSON.parse(content.toString("utf8")) as unknown;
    if (!isRecord(value)) return null;
    const rest = { ...value };
    delete rest.name;
    delete rest.version;
    return sha256(Buffer.from(canonical(rest)));
  } catch {
    return null;
  }
}

// 배포본의 파일들로 서명할 manifest를 만든다. Store가 등록받을 때 부르고, 규격에 어긋나면 사유를 던진다.
export function buildCoreManifest(files: Map<string, Buffer>): CoreManifest {
  if (files.size === 0 || files.size > MAX_ENTRIES) throw new InstallerError(`코어 배포본의 파일은 1개 이상 ${MAX_ENTRIES}개 이하여야 합니다.`);
  const unsafe = [...files.keys()].find((file) => !isCoreReleasePath(file));
  if (unsafe) throw new InstallerError(`코어 배포본에 넣을 수 없는 경로가 있습니다: ${unsafe}`);
  let version: unknown;
  try { version = (JSON.parse(files.get(CORE_VERSION_FILE)?.toString("utf8") ?? "") as { version?: unknown }).version; }
  catch { /* 아래에서 알린다. */ }
  if (typeof version !== "string" || !VERSION.test(version)) throw new InstallerError(`${CORE_VERSION_FILE}에 1.2.3 형식의 버전이 있어야 합니다.`);
  const packageJson = files.get(PACKAGE_JSON);
  const packageJsonHash = packageJson ? packageJsonCoreSha256(packageJson) : null;
  if (!packageJsonHash) throw new InstallerError("코어 배포본에 읽을 수 있는 package.json이 있어야 합니다.");
  return {
    schemaVersion: 1,
    type: "plextype-core",
    version,
    files: [...files.keys()].sort().map((file) => ({ path: file, size: files.get(file)!.length, sha256: sha256(files.get(file)!) })),
    packageJsonCoreSha256: packageJsonHash,
  };
}

function parseCoreMetadata(value: unknown, version: string): CoreMetadata {
  const fail = () => new InstallerError("Store가 보낸 코어 배포본 정보가 규격에 맞지 않습니다.");
  if (!isRecord(value) || !isRecord(value.manifest) || !isRecord(value.signature)) throw fail();
  const { manifest, signature } = value;
  if (typeof value.sha256 !== "string" || !SHA256.test(value.sha256) ||
      typeof value.size !== "number" || !Number.isInteger(value.size) || value.size <= 0 || value.size > MAX_PACKAGE_BYTES ||
      typeof signature.algorithm !== "string" || typeof signature.keyId !== "string" || typeof signature.value !== "string" ||
      manifest.schemaVersion !== 1 || manifest.type !== "plextype-core" || manifest.version !== version ||
      typeof manifest.packageJsonCoreSha256 !== "string" || !SHA256.test(manifest.packageJsonCoreSha256) ||
      !Array.isArray(manifest.files) || manifest.files.length === 0 || manifest.files.length > MAX_ENTRIES) throw fail();
  const seen = new Set<string>();
  for (const file of manifest.files) {
    if (!isRecord(file) || typeof file.path !== "string" || !isCoreReleasePath(file.path) || seen.has(file.path.toLowerCase()) ||
        typeof file.size !== "number" || !Number.isInteger(file.size) || file.size < 0 ||
        typeof file.sha256 !== "string" || !SHA256.test(file.sha256)) throw fail();
    seen.add(file.path.toLowerCase());
  }
  if (!seen.has(CORE_VERSION_FILE) || !seen.has(PACKAGE_JSON)) throw fail();
  return value as unknown as CoreMetadata;
}

const UNSUPPORTED_CORE = "이 주소의 Store는 코어 배포본을 제공하지 않습니다.";

// Store가 가진 코어 배포본 목록. 새 버전이 앞에 온다. 로그인이 필요 없다.
export async function fetchCoreReleases(storeUrl: string): Promise<CoreRelease[]> {
  const body = await storeJson(storeUrl, "/api/store/core", undefined, UNSUPPORTED_CORE);
  if (!isRecord(body) || !Array.isArray(body.releases)) throw new InstallerError("Store 응답을 읽지 못했습니다. Store 주소가 맞는지 확인해주세요.");
  return body.releases.flatMap((item) => (
    isRecord(item) && typeof item.version === "string" && VERSION.test(item.version)
      ? [{ version: item.version, size: typeof item.size === "number" ? item.size : 0, releasedAt: typeof item.releasedAt === "string" ? item.releasedAt : "" }]
      : []
  )).sort((left, right) => compareVersions(right.version, left.version));
}

// 코어를 직접 고쳐 배포하는 원본 저장소인지. 원본은 배포본을 만드는 쪽이라 받지 않는다.
export const isCoreSource = (root: string) => fs.access(path.join(root, SOURCE_MARKER)).then(() => true, () => false);

export type CoreConflictKind =
  // 직접 고친 파일이 새 버전에서도 바뀌었다.
  | "modified"
  // 직접 지운 파일이 새 버전에서 바뀌었다.
  | "deleted"
  // 직접 고친 파일이 새 버전에서 없어졌다.
  | "removed"
  // 새 버전이 추가한 자리에 다른 내용의 파일이 이미 있다. 기준이 없을 때는 내용이 다른 모든 파일이 여기에 든다.
  | "occupied";

export type CoreUpdatePreview = {
  currentVersion: string;
  version: string;
  // 미리 본 것과 같은 배포본을 적용하도록 적용할 때 그대로 넘긴다.
  sha256: string;
  size: number;
  // 지금 버전의 배포본이 Store에 있는지. 없으면 직접 고친 파일을 가려낼 수 없고, 새 버전에서 없어진 파일도 지우지 못한다.
  hasBaseline: boolean;
  // 적용을 막는 사유. 하나라도 있으면 적용할 수 없다.
  blockers: string[];
  writes: { path: string; change: "added" | "changed" }[];
  removes: string[];
  conflicts: { path: string; kind: CoreConflictKind }[];
  // 직접 고쳤지만 새 버전에서 바뀌지 않아 그대로 두는 파일.
  kept: string[];
  // 새 버전에서 범위가 달라지는 npm 라이브러리. 하나라도 있으면 적용 후 npm install이 필요하다.
  dependencies: string[];
  // 새로 들어오는 코어 마이그레이션. DB에는 적용하지 않는다.
  migrations: string[];
  // 적용하면 프로젝트 루트의 AGENTS.md가 어떻게 되는지(lib/agentsFile.ts). 공통 규칙 파일이 없는 배포본이면 null.
  agents: AgentsFileStatus | null;
};

export type CoreUpdateResult = {
  version: string;
  previousVersion: string;
  written: number;
  removed: number;
  // 충돌 가운데 그대로 둔 파일. 새 버전의 내용은 referencePath에 있다.
  keptConflicts: string[];
  backupPath: string | null;
  referencePath: string | null;
  dependencies: string[];
  migrations: string[];
  // AGENTS.md에 한 일. 공통 규칙 파일이 없는 배포본이면 null.
  agents: AgentsFileResult | null;
};

type Conflict = { path: string; kind: CoreConflictKind; content: Buffer | null };

const relativeToRoot = (root: string, target: string) => path.relative(root, target).split(path.sep).join("/");

async function downloadCoreMetadata(storeUrl: string, token: string, version: string, keys: Parameters<typeof verifyPackageSignature>[1]) {
  const metadata = parseCoreMetadata(await storeJson(storeUrl, `/api/store/core/${version}?metadata=1`, token, UNSUPPORTED_CORE), version);
  if (!verifyPackageSignature(metadata, keys)) {
    throw new InstallerError("코어 배포본의 서명을 확인하지 못했습니다. 연결 관리에서 서명 키를 새로 받은 뒤 다시 시도해주세요.");
  }
  return metadata;
}

// 프로젝트에 있는 파일을 견줄 해시로 바꾼다. 없으면 null, 파일이 아닌 것(폴더, 링크)이 자리를 차지하고 있으면 "blocked".
async function localIdentity(root: string, file: string) {
  let stat: Stats;
  try { stat = await fs.lstat(path.join(root, file)); }
  catch { return null; }
  if (!stat.isFile()) return "blocked" as const;
  const content = await fs.readFile(path.join(root, file));
  return file === PACKAGE_JSON ? packageJsonCoreSha256(content) ?? sha256(content) : sha256(content);
}

const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

function changedDependencies(current: Buffer | null, next: Buffer) {
  const read = (content: Buffer | null) => {
    const ranges = new Map<string, string>();
    try {
      const value = JSON.parse(content?.toString("utf8") ?? "{}") as unknown;
      for (const field of DEPENDENCY_FIELDS) {
        const group = isRecord(value) ? value[field] : null;
        if (isRecord(group)) for (const [name, range] of Object.entries(group)) ranges.set(`${field}/${name}`, String(range));
      }
    } catch { /* 읽지 못한 쪽은 라이브러리가 없는 것으로 본다. */ }
    return ranges;
  };
  const before = read(current);
  const after = read(next);
  const names = new Set<string>();
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    if (before.get(key) !== after.get(key)) names.add(key.slice(key.indexOf("/") + 1));
  }
  return [...names].sort();
}

// 새 package.json에 프로젝트의 name과 version을 남긴다. 앱 이름과 앱 버전은 코어가 정하지 않는다.
function mergePackageJson(next: Buffer, current: Buffer | null) {
  try {
    const merged = JSON.parse(next.toString("utf8")) as Record<string, unknown>;
    const mine = JSON.parse(current?.toString("utf8") ?? "") as unknown;
    if (!isRecord(mine)) return next;
    for (const key of ["name", "version"]) if (typeof mine[key] === "string") merged[key] = mine[key];
    return Buffer.from(JSON.stringify(merged, null, 2) + "\n");
  } catch {
    return next;
  }
}

// 새 버전의 배포본을 받아 검증하고, 프로젝트의 파일과 견주어 할 일을 정한다. 여기서는 아무것도 쓰지 않는다.
async function planCoreUpdate(root: string, requestedVersion?: string) {
  assertInstallAllowed();
  if (await isCoreSource(root)) throw new InstallerError("이 저장소는 코어의 원본이라 Store에서 코어를 받지 않습니다.");
  const connection = await readConnection(root);
  if (!connection) throw new InstallerError("먼저 Store에 연결해주세요.");
  const currentVersion = await readPlatformVersion(root);
  const releases = await fetchCoreReleases(connection.storeUrl);
  const version = requestedVersion ?? releases[0]?.version;
  if (!version || !releases.some((release) => release.version === version)) throw new InstallerError("Store에서 받을 코어 배포본을 찾지 못했습니다.");
  if (compareVersions(version, currentVersion) <= 0) throw new InstallerError(`이미 Plextype ${currentVersion}입니다. 받을 새 버전이 없습니다.`);

  const metadata = await downloadCoreMetadata(connection.storeUrl, connection.token, version, connection.keys);
  // 기준은 지금 버전의 배포본이다. Store가 배포를 시작하기 전의 버전이면 없다.
  const baseline = releases.some((release) => release.version === currentVersion)
    ? await downloadCoreMetadata(connection.storeUrl, connection.token, currentVersion, connection.keys)
    : null;

  const response = await storeRequest(connection.storeUrl, `/api/store/core/${version}`, connection.token);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== metadata.size || sha256(bytes) !== metadata.sha256) throw new InstallerError("내려받은 파일이 서명된 코어 배포본과 다릅니다. 다시 시도해주세요.");
  const contents = readZipEntries(bytes);
  if (contents.size !== metadata.manifest.files.length || metadata.manifest.files.some((file) => {
    const content = contents.get(file.path);
    return !content || content.length !== file.size || sha256(content) !== file.sha256;
  })) throw new InstallerError("코어 배포본의 내용이 서명된 파일 목록과 다릅니다.");

  // package.json은 name과 version을 뺀 해시로 견준다. 그 밖의 파일은 내용의 해시 그대로다.
  const identities = (manifest: CoreManifest) => new Map(manifest.files.map((file) => [file.path, file.path === PACKAGE_JSON ? manifest.packageJsonCoreSha256 : file.sha256]));
  const next = identities(metadata.manifest);
  const base = baseline ? identities(baseline.manifest) : new Map<string, string>();

  const blockers: string[] = [];
  const writes: { path: string; change: "added" | "changed"; content: Buffer }[] = [];
  const removes: string[] = [];
  const conflicts: Conflict[] = [];
  const kept: string[] = [];
  const rootReal = await fs.realpath(root);
  const checkedDirectories = new Map<string, boolean>();
  // 경로 중간의 폴더가 프로젝트 밖을 가리키는 링크면 그 안에는 쓰지 않는다.
  const insideProject = async (file: string) => {
    let directory = path.dirname(path.join(rootReal, file));
    const key = directory;
    if (checkedDirectories.has(key)) return checkedDirectories.get(key)!;
    for (;;) {
      try {
        const real = await fs.realpath(directory);
        const inside = real === rootReal || real.startsWith(rootReal + path.sep);
        checkedDirectories.set(key, inside);
        return inside;
      } catch {
        directory = path.dirname(directory);
      }
    }
  };

  // 대소문자를 구분하지 않는 파일 시스템(macOS, Windows의 기본값)에서는 이름의 대소문자만 다른 파일도 같은 경로로 열린다.
  // 폴더에 실제로 적힌 이름을 읽어, 그 이름 그대로 있는 파일과 대소문자만 다른 이름으로 자리를 차지한 파일을 가려낸다.
  const listings = new Map<string, string[]>();
  const namesIn = async (file: string) => {
    const directory = path.dirname(path.join(root, file));
    if (!listings.has(directory)) listings.set(directory, await fs.readdir(directory).catch(() => []));
    return listings.get(directory)!;
  };
  const caseTwin = async (file: string) => {
    const name = path.basename(file);
    const twin = (await namesIn(file)).find((entry) => entry !== name && entry.toLowerCase() === name.toLowerCase());
    return twin ? path.posix.join(path.posix.dirname(file), twin) : null;
  };

  let localPackageJson: Buffer | null = null;
  try { localPackageJson = await fs.readFile(path.join(root, PACKAGE_JSON)); }
  catch { /* 없으면 새 package.json을 그대로 쓴다. */ }

  for (const file of [...new Set([...base.keys(), ...next.keys()])].sort()) {
    const local = (await namesIn(file)).includes(path.basename(file)) ? await localIdentity(root, file) : null;
    const wanted = next.get(file) ?? null;
    const origin = base.get(file) ?? null;
    if (local === wanted) continue;
    if (local !== origin && wanted === origin) {
      // 새 버전이 건드리지 않은 파일이다. 직접 고쳤거나 지웠거나 폴더·링크로 바꾼 그대로 둔다.
      if (local !== null) kept.push(file);
      continue;
    }
    if (local === "blocked" || !(await insideProject(file))) {
      blockers.push(`${file} 자리에 폴더나 링크가 있어 코어 파일을 쓸 수 없습니다.`);
      continue;
    }
    const content = wanted === null ? null : file === PACKAGE_JSON ? mergePackageJson(contents.get(file)!, localPackageJson) : contents.get(file)!;
    if (local === origin) {
      if (content === null) removes.push(file);
      else writes.push({ path: file, change: local === null ? "added" : "changed", content });
    } else {
      conflicts.push({ path: file, kind: content === null ? "removed" : local === null ? "deleted" : origin === null ? "occupied" : "modified", content });
    }
  }

  // 새 버전이 파일 이름의 대소문자만 바꾼 경우, 새 이름의 자리는 옛 이름의 파일이 차지하고 있다. 옛 파일을 이번에 지운다면
  // 지운 뒤에 쓰면 되지만(적용은 지우기를 먼저 한다), 직접 고쳐서 남기는 파일이라면 그 위에 쓰지 않도록 충돌로 돌린다.
  for (const item of [...writes]) {
    if (item.change !== "added") continue;
    const twin = await caseTwin(item.path);
    const sameFile = twin !== null && await fs.lstat(path.join(root, item.path)).then(() => true, () => false);
    if (!sameFile || removes.includes(twin!)) continue;
    writes.splice(writes.indexOf(item), 1);
    conflicts.push({ path: item.path, kind: "occupied", content: item.content });
  }
  conflicts.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));

  const incoming = [...writes, ...conflicts.filter((item) => item.content !== null)];
  const migrations: string[] = [];
  for (const item of incoming) {
    const match = MIGRATION_FILE.exec(item.path);
    if (match && (await localIdentity(root, item.path)) === null) migrations.push(match[1]);
  }
  return {
    currentVersion, metadata, hasBaseline: Boolean(baseline), blockers, writes, removes, conflicts, kept,
    dependencies: changedDependencies(localPackageJson, contents.get(PACKAGE_JSON)!),
    migrations: migrations.sort(),
    // AGENTS.md의 구역은 새 버전의 공통 규칙으로 채운다. 그 파일을 직접 고쳐 남기더라도 규칙은 배포본의 것을 쓴다.
    agentsRules: contents.get(AGENTS_RULES_FILE)?.toString("utf8") ?? null,
  };
}

export async function previewCoreUpdate(root: string, version?: string): Promise<CoreUpdatePreview> {
  const plan = await planCoreUpdate(root, version);
  return {
    currentVersion: plan.currentVersion,
    version: plan.metadata.manifest.version,
    sha256: plan.metadata.sha256,
    size: plan.metadata.size,
    hasBaseline: plan.hasBaseline,
    blockers: plan.blockers,
    writes: plan.writes.map(({ path: file, change }) => ({ path: file, change })),
    removes: plan.removes,
    conflicts: plan.conflicts.map(({ path: file, kind }) => ({ path: file, kind })),
    kept: plan.kept,
    dependencies: plan.dependencies,
    migrations: plan.migrations,
    agents: plan.agentsRules === null ? null : await previewAgentsFile(root, plan.agentsRules),
  };
}

// 파일을 지운 뒤 비게 된 폴더를 프로젝트 루트 아래에서 위로 올라가며 지운다. 비어 있지 않은 폴더에서 멈춘다.
async function removeEmptyParents(root: string, file: string) {
  for (let directory = path.dirname(path.join(root, file)); directory.startsWith(root + path.sep); directory = path.dirname(directory)) {
    try { await fs.rmdir(directory); }
    catch { return; }
  }
}

// 미리 본 배포본을 적용한다. 충돌이 있으면 conflicts로 정한 대로 한다: "keep"은 내 파일을 두고 새 버전의 내용을
// .plextype/reference에 받아 두며, "overwrite"는 새 버전대로 바꾼다. 바뀌거나 지워지는 파일은 모두 .plextype/backup에 남는다.
export async function applyCoreUpdate(
  root: string,
  options: { version: string; sha256: string; conflicts?: "keep" | "overwrite" },
): Promise<CoreUpdateResult> {
  const plan = await planCoreUpdate(root, options.version);
  const { version } = plan.metadata.manifest;
  if (plan.metadata.sha256 !== options.sha256) throw new InstallerError("확인한 뒤에 Store의 코어 배포본이 바뀌었습니다. 다시 확인해주세요.");
  if (plan.blockers.length > 0) throw new InstallerError(plan.blockers.join("\n"));
  if (plan.conflicts.length > 0 && !options.conflicts) {
    throw new InstallerError(`직접 고친 코어 파일 ${plan.conflicts.length}개가 새 버전과 충돌해 적용하지 않았습니다. 그대로 둘지 덮어쓸지 정해주세요.`);
  }
  // 기준이 없으면 내용이 다른 파일이 모두 충돌로 잡힌다. 그것들을 두면 버전만 오르고 코어는 그대로이므로 덮어쓰기만 받는다.
  if (plan.conflicts.length > 0 && !plan.hasBaseline && options.conflicts !== "overwrite") {
    throw new InstallerError(`Store에 Plextype ${plan.currentVersion}의 배포본이 없어 직접 고친 파일을 가려낼 수 없습니다. 내용이 다른 파일을 모두 새 버전으로 바꾸는 방법으로만 적용할 수 있습니다.`);
  }

  const overwrite = options.conflicts === "overwrite";
  const operations: { path: string; content: Buffer | null }[] = [
    ...plan.writes.map((item) => ({ path: item.path, content: item.content as Buffer | null })),
    ...plan.removes.map((file) => ({ path: file, content: null })),
    ...(overwrite ? plan.conflicts.map((item) => ({ path: item.path, content: item.content })) : []),
  ];
  const keptConflicts = overwrite ? [] : plan.conflicts;

  // 지우기를 먼저 한다. 파일이 같은 이름의 폴더로 바뀌거나 이름의 대소문자만 바뀐 경우, 옛 파일이 비켜야 새 파일을 놓을 수 있다.
  const removals = operations.filter((item) => item.content === null);
  const placements = operations.filter((item) => item.content !== null);
  const stamp = `core-${plan.currentVersion}-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const staging = statePath(root, "tmp", stamp);
  const backup = statePath(root, "backup", stamp);
  const placed: string[] = [];
  const backedUp: string[] = [];
  const moveToBackup = async (file: string) => {
    if (!(await fs.lstat(path.join(root, file)).then(() => true, () => false))) return;
    await fs.mkdir(path.dirname(path.join(backup, file)), { recursive: true });
    await fs.rename(path.join(root, file), path.join(backup, file));
    backedUp.push(file);
  };
  try {
    for (const { path: file, content } of placements) {
      await fs.mkdir(path.dirname(path.join(staging, file)), { recursive: true });
      await fs.writeFile(path.join(staging, file), content!, { flag: "wx" });
    }
    for (const { path: file } of removals) await moveToBackup(file);
    for (const { path: file } of removals) await removeEmptyParents(root, file);
    for (const { path: file } of placements) {
      await moveToBackup(file);
      await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await fs.rename(path.join(staging, file), path.join(root, file));
      placed.push(file);
    }
  } catch (error) {
    // 중간에 실패하면 적용 전 상태로 되돌린다. 되돌리지 못한 파일이 있으면 그 사본이 든 백업 폴더는 지우지 않는다.
    for (const file of placed) {
      await fs.rm(path.join(root, file), { force: true }).catch(() => {});
      await removeEmptyParents(root, file);
    }
    let unrestored = 0;
    for (const file of backedUp) {
      try {
        await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
        await fs.rename(path.join(backup, file), path.join(root, file));
      } catch { unrestored++; }
    }
    await fs.rm(staging, { recursive: true, force: true }).catch(() => {});
    if (unrestored > 0) {
      throw new InstallerError(`코어 파일을 쓰는 중 오류가 났고, 파일 ${unrestored}개를 제자리로 되돌리지 못했습니다. 원래 파일은 ${relativeToRoot(root, backup)}에 있으니 직접 옮겨주세요.`);
    }
    await fs.rm(backup, { recursive: true, force: true }).catch(() => {});
    if (error instanceof InstallerError) throw error;
    throw new InstallerError("코어 파일을 쓰는 중 오류가 나서 적용 전 상태로 되돌렸습니다. 폴더 권한을 확인해주세요.");
  }
  await fs.rm(staging, { recursive: true, force: true }).catch(() => {});

  // 여기부터는 코어 파일이 이미 새 버전이다. 비교용 사본을 쓰지 못해도 적용을 실패로 돌리지 않고, 사본이 없다고만 알린다.
  const reference = statePath(root, "reference", `core-${version}`);
  let referenced = keptConflicts.filter((item) => item.content !== null);
  try {
    if (referenced.length > 0) await fs.rm(reference, { recursive: true, force: true });
    for (const item of referenced) {
      await fs.mkdir(path.dirname(path.join(reference, item.path)), { recursive: true });
      await fs.writeFile(path.join(reference, item.path), item.content!);
    }
  } catch {
    referenced = [];
  }
  // AGENTS.md도 코어 파일과 같은 처지다: 쓰지 못해도 적용을 실패로 돌리지 않는다.
  const agents = plan.agentsRules === null ? null : await syncAgentsFile(root, plan.agentsRules, {
    reference: `core-${version}`,
    backup: relativeToRoot(root, backup),
  }).catch(() => null);
  // 그대로 둔 파일의 변경은 프로젝트에 들어오지 않았다. 그 파일에서 비롯된 npm install과 마이그레이션은 할 일에서 뺀다.
  const kept = new Set(keptConflicts.map((item) => item.path));
  const migrations = plan.migrations.filter((name) => !keptConflicts.some((item) => MIGRATION_FILE.exec(item.path)?.[1] === name));
  return {
    version,
    previousVersion: plan.currentVersion,
    written: operations.filter((item) => item.content !== null).length,
    removed: operations.filter((item) => item.content === null).length,
    keptConflicts: keptConflicts.map((item) => item.path),
    backupPath: backedUp.length > 0 || agents?.status === "updated" ? relativeToRoot(root, backup) : null,
    referencePath: referenced.length > 0 ? relativeToRoot(root, reference) : null,
    dependencies: kept.has(PACKAGE_JSON) ? [] : plan.dependencies,
    migrations,
    agents,
  };
}

// 적용한 뒤 사람이 할 일. npm install과 DB 적용은 고른 경우에만 설치기가 실행하며(lib/applyDatabase.ts의 finishCoreUpdate),
// 실행을 마쳤으면 finished로 알려 그 명령들을 목록에서 뺀다.
export function coreUpdateNextSteps(
  result: Pick<CoreUpdateResult, "version" | "dependencies" | "migrations" | "keptConflicts" | "referencePath" | "agents">,
  { finished = false } = {},
) {
  const commands = finished ? [] : [
    result.dependencies.length > 0 ? "npm install" : "",
    // migrate는 스키마를 합쳐 클라이언트를 다시 만든 뒤 마이그레이션까지 적용한다.
    result.migrations.length > 0 ? "npm run plextype -- migrate" : "npm run prisma:generate",
  ];
  return [
    result.keptConflicts.length > 0 ? `그대로 둔 파일 ${result.keptConflicts.length}개에 새 버전의 변경을 직접 반영합니다. 새 버전의 내용은 ${result.referencePath ?? `${STATE_DIRECTORY}/reference`}에 있습니다.` : "",
    result.agents?.status === "manual" ? describeAgentsFile(result.agents) : "",
    ...commands,
    "개발 서버를 다시 시작하고 npm run build로 확인합니다.",
    `확인한 뒤 "chore(core): Plextype ${result.version}" 메시지로 커밋합니다.`,
  ].filter(Boolean);
}
