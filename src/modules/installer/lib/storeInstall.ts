// Store에 연결해 확장 패키지를 내려받고, 검증한 뒤 src/packages에 설치하는 로직.
//
// 관리자 화면(서버 액션)과 명령 줄(scripts/plextype.mjs)이 함께 쓴다. 명령 줄에서는 Node가 이 파일을 직접 읽으므로
// - Node 내장 모듈만 import하고(경로 별칭 `@/`와 다른 소스 파일 import 금지),
// - 지워지기만 하면 되는 타입 문법만 쓴다(enum, namespace, 생성자 매개변수 속성 금지).
//
// 설치는 소스 코드를 프로젝트에 넣는 일이라 개발 환경에서만 한다. 운영 서버에는 저장소에 커밋된 결과가 배포로 들어간다.
// Store 구현(src/extensions/store)을 참조하지 않고 Store의 HTTP API만 쓴다.

import { createHash, randomBytes, verify } from "node:crypto";
import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

export type StoreKey = { keyId: string; publicKey: string };

export type StoreConnection = {
  schemaVersion: 1;
  storeUrl: string;
  token: string;
  accountName: string;
  tokenName: string;
  // 연결할 때 Store에서 받아 둔 서명 검증 키. 패키지에 함께 들어 있는 공개 키는 믿지 않고 이 목록으로만 검증한다.
  keys: StoreKey[];
  connectedAt: string;
};

export type CatalogProduct = {
  productUuid: string;
  name: string;
  summary: string;
  category: string;
  licenseType: string;
  sellerName: string;
  packageId: string;
  version: string;
  minPlatformVersion: string;
  maxPlatformVersion: string | null;
  requiresDatabaseReview: boolean;
  size: number;
  // 보안 패치로 표시된 공개 버전들. 설치했거나 가져온 버전보다 새 것이 있으면 서둘러 반영해야 한다.
  securityVersions: string[];
};

type PackageManifest = {
  schemaVersion: 1;
  type: "plextype-extension";
  productUuid: string;
  packageId: string;
  version: string;
  minPlatformVersion: string;
  maxPlatformVersion: string | null;
  installPath: string;
  files: { path: string; size: number; sha256: string }[];
  requiresDatabaseReview: boolean;
  requires?: PackageRequirements;
};

// 패키지가 설치되려면 프로젝트에 있어야 하는 것. 제작자가 plextype.requires.json에 적고 Store가 서명된 정보에 넣는다.
export type PackageRequirements = {
  node: string | null;
  packages: { packageId: string; minVersion: string }[];
  npm: { name: string; range: string }[];
};

type PackageMetadata = {
  versionUuid: string;
  manifest: PackageManifest;
  sha256: string;
  size: number;
  signature: { algorithm: string; keyId: string; value: string };
};

type RouteEntry = { route: string; implementation: string; configs: string[]; exports?: string[] };

export type InstallResult = {
  packageId: string;
  version: string;
  previousVersion: string | null;
  installPath: string;
  routes: string[];
  // registry 파일이 있어 관리자 메뉴·스킨 등록 목록에 들어갔는지.
  registered: boolean;
  requiresDatabaseReview: boolean;
  // 이번 설치로 새로 들어온 마이그레이션 이름. DB에는 아직 적용되지 않았다. 함께 설치한 패키지의 것도 들어 있다.
  newMigrations: string[];
  // 이 패키지가 필요로 해서 함께 설치하거나 업데이트한 패키지.
  alsoInstalled: { packageId: string; version: string; previousVersion: string | null }[];
};

// 사용자에게 그대로 보여 줘도 되는 실패 사유. 그 밖의 예외는 내부 경로 등이 섞일 수 있어 화면에 내보내지 않는다.
export class InstallerError extends Error {}

export const DEFAULT_STORE_URL = "https://gjworks.dev";
// 연결 정보(토큰 포함)와 임시·백업 폴더를 두는 곳. 저장소에 올리지 않는다(.gitignore).
export const STATE_DIRECTORY = ".plextype";
// 설치한 패키지를 두는 곳. 직접 만드는 확장(src/extensions)과 섞이지 않게 따로 두며, 이 안은 설치기만 고친다.
export const PACKAGES_DIRECTORY = "src/packages";
const CONNECTION_FILE = "store.json";

// Store의 패키지 생성 제한(src/extensions/store/package.ts)과 같은 값. 서명된 패키지는 이 안에 들어온다.
const MAX_PACKAGE_BYTES = 50 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 100 * 1024 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ENTRIES = 2000;
const REQUEST_TIMEOUT = 20_000;

const PACKAGE_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const UUID = /^[A-Za-z0-9_-]{1,128}$/;
const TOKEN = /^pxt_[a-f0-9]{16}_[a-f0-9]{48}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const ROUTE_EXPORT = /^(default|GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|generateMetadata|generateStaticParams)$/;
// 연결 파일에 그대로 적히는 줄이라, Next.js가 정적으로 읽는 설정 선언 한 줄만 받는다.
const ROUTE_CONFIG = /^export const (dynamic|dynamicParams|revalidate|fetchCache|runtime|preferredRegion|maxDuration) = ("[A-Za-z0-9_-]+"|\d+|true|false);$/;
const ADAPTER_HEADERS = [
  "// Extension-owned implementation; keep route configuration statically visible.",
  "// Implementation is owned by Store; route configuration stays statically visible.",
];

const sha256 = (value: Buffer) => createHash("sha256").update(value).digest("hex");
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function assertInstallAllowed() {
  if (process.env.NODE_ENV === "production") {
    throw new InstallerError("설치와 연결은 개발 환경에서만 할 수 있습니다. 로컬에서 설치한 뒤 배포해주세요.");
  }
}

export function compareVersions(a: string, b: string) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) return left[index] < right[index] ? -1 : 1;
  }
  return 0;
}

// 토큰이 평문으로 새지 않도록 https만 받는다. 같은 컴퓨터의 개발 서버(localhost)는 http를 허용한다.
export function normalizeStoreUrl(input: string) {
  let url: URL;
  try { url = new URL(input.trim()); }
  catch { throw new InstallerError("Store 주소를 https://example.com 형식으로 입력해주세요."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.hostname.endsWith(".localhost");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) {
    throw new InstallerError("Store 주소는 https여야 합니다.");
  }
  if (url.username || url.password) throw new InstallerError("Store 주소에 계정 정보를 넣을 수 없습니다.");
  return url.origin;
}

// 자료를 받는 주소가 아닌 연결용 주소(목록, 키, 토큰 확인)가 없다는 것은 그 사이트가 쉬운 설치를 지원하지 않는다는 뜻이다.
const UNSUPPORTED_STORE = "이 주소의 Store는 쉬운 설치 연결을 지원하지 않습니다. Store 주소를 확인해주세요.";

async function storeRequest(storeUrl: string, pathname: string, token?: string, notFound = "Store에서 자료를 찾지 못했습니다.") {
  let response: Response;
  try {
    response = await fetch(storeUrl + pathname, {
      headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/json, application/zip" } : { Accept: "application/json" },
      // 다른 주소로 넘겨지면 토큰이 그쪽으로 따라가므로 따라가지 않는다.
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
  } catch {
    throw new InstallerError("Store에 연결하지 못했습니다. 주소와 네트워크를 확인해주세요.");
  }
  if (response.status === 401) throw new InstallerError("토큰이 유효하지 않거나 Store 자료를 받을 권한이 없습니다. Store의 액세스 토큰 화면에서 토큰을 확인해주세요.");
  if (response.status === 404) throw new InstallerError(notFound);
  if (!response.ok) throw new InstallerError(`Store가 요청을 처리하지 못했습니다. (${response.status})`);
  return response;
}

async function storeJson(storeUrl: string, pathname: string, token?: string, notFound?: string) {
  const response = await storeRequest(storeUrl, pathname, token, notFound);
  try { return await response.json() as unknown; }
  catch { throw new InstallerError("Store 응답을 읽지 못했습니다. Store 주소가 맞는지 확인해주세요."); }
}

const statePath = (root: string, ...parts: string[]) => path.join(root, STATE_DIRECTORY, ...parts);

function parseKeys(value: unknown): StoreKey[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => (
    isRecord(item) && typeof item.keyId === "string" && /^[A-Za-z0-9._-]{1,80}$/.test(item.keyId) &&
    typeof item.publicKey === "string" && item.publicKey.length < 2000
      ? [{ keyId: item.keyId, publicKey: item.publicKey }] : []
  ));
}

export async function readConnection(root: string): Promise<StoreConnection | null> {
  let raw: string;
  try { raw = await fs.readFile(statePath(root, CONNECTION_FILE), "utf8"); }
  catch { return null; }
  try {
    const value = JSON.parse(raw) as unknown;
    if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.storeUrl !== "string" || typeof value.token !== "string" || !TOKEN.test(value.token)) return null;
    return {
      schemaVersion: 1,
      storeUrl: normalizeStoreUrl(value.storeUrl),
      token: value.token,
      accountName: typeof value.accountName === "string" ? value.accountName : "",
      tokenName: typeof value.tokenName === "string" ? value.tokenName : "",
      keys: parseKeys(value.keys),
      connectedAt: typeof value.connectedAt === "string" ? value.connectedAt : "",
    };
  } catch {
    return null;
  }
}

async function writeConnection(root: string, connection: StoreConnection) {
  await fs.mkdir(statePath(root), { recursive: true, mode: 0o700 });
  // 토큰이 들어 있으므로 소유자만 읽고 쓸 수 있게 한다.
  await fs.writeFile(statePath(root, CONNECTION_FILE), JSON.stringify(connection, null, 2) + "\n", { mode: 0o600 });
  await fs.chmod(statePath(root, CONNECTION_FILE), 0o600);
}

async function fetchKeys(storeUrl: string) {
  const body = await storeJson(storeUrl, "/api/store/keys", undefined, UNSUPPORTED_STORE);
  return isRecord(body) ? parseKeys(body.keys) : [];
}

export async function connectStore(root: string, storeUrlInput: string, tokenInput: string) {
  assertInstallAllowed();
  const storeUrl = normalizeStoreUrl(storeUrlInput || DEFAULT_STORE_URL);
  const token = tokenInput.trim();
  if (!TOKEN.test(token)) throw new InstallerError("토큰 형식이 올바르지 않습니다. Store의 액세스 토큰 화면에서 만든 토큰을 그대로 붙여 넣어주세요.");
  const account = await storeJson(storeUrl, "/api/store/connection", token, UNSUPPORTED_STORE);
  if (!isRecord(account)) throw new InstallerError("Store 응답을 읽지 못했습니다. Store 주소가 맞는지 확인해주세요.");
  const connection: StoreConnection = {
    schemaVersion: 1,
    storeUrl,
    token,
    accountName: typeof account.accountName === "string" ? account.accountName.slice(0, 120) : "",
    tokenName: typeof account.tokenName === "string" ? account.tokenName.slice(0, 120) : "",
    keys: await fetchKeys(storeUrl),
    connectedAt: new Date().toISOString(),
  };
  await writeConnection(root, connection);
  return connection;
}

// Store가 서명 키를 바꾸었을 때 보관한 키 목록을 다시 받는다.
export async function refreshStoreKeys(root: string) {
  assertInstallAllowed();
  const connection = await readConnection(root);
  if (!connection) throw new InstallerError("먼저 Store에 연결해주세요.");
  const next = { ...connection, keys: await fetchKeys(connection.storeUrl) };
  await writeConnection(root, next);
  return next;
}

export async function disconnectStore(root: string) {
  assertInstallAllowed();
  await fs.rm(statePath(root, CONNECTION_FILE), { force: true });
}

export async function fetchCatalog(storeUrl: string): Promise<CatalogProduct[]> {
  const body = await storeJson(normalizeStoreUrl(storeUrl), "/api/store/catalog", undefined, UNSUPPORTED_STORE);
  if (!isRecord(body) || !Array.isArray(body.products)) throw new InstallerError("Store 응답을 읽지 못했습니다. Store 주소가 맞는지 확인해주세요.");
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");
  return body.products.flatMap((item) => {
    const latest = isRecord(item) ? item.latest : null;
    if (!isRecord(item) || !isRecord(latest) || typeof item.productUuid !== "string" || !UUID.test(item.productUuid) ||
        typeof latest.packageId !== "string" || !PACKAGE_ID.test(latest.packageId) ||
        typeof latest.version !== "string" || !VERSION.test(latest.version) ||
        typeof latest.minPlatformVersion !== "string" || !VERSION.test(latest.minPlatformVersion) ||
        (latest.maxPlatformVersion !== null && (typeof latest.maxPlatformVersion !== "string" || !VERSION.test(latest.maxPlatformVersion)))) return [];
    return [{
      productUuid: item.productUuid,
      name: text(item.name, 180) || latest.packageId,
      summary: text(item.summary, 500),
      category: text(item.category, 60),
      licenseType: text(item.licenseType, 60),
      sellerName: text(item.sellerName, 120),
      packageId: latest.packageId,
      version: latest.version,
      minPlatformVersion: latest.minPlatformVersion,
      maxPlatformVersion: latest.maxPlatformVersion as string | null,
      requiresDatabaseReview: latest.requiresDatabaseReview === true,
      size: typeof latest.size === "number" ? latest.size : 0,
      securityVersions: Array.isArray(item.securityVersions)
        ? item.securityVersions.filter((value): value is string => typeof value === "string" && VERSION.test(value)).slice(0, 200)
        : [],
    }];
  });
}

export async function readPlatformVersion(root: string) {
  try {
    const value = JSON.parse(await fs.readFile(path.join(root, "src", "core", "plextype.json"), "utf8")) as unknown;
    if (isRecord(value) && typeof value.version === "string" && VERSION.test(value.version)) return value.version;
  } catch { /* 아래에서 알린다. */ }
  throw new InstallerError("이 프로젝트의 Plextype 버전(src/core/plextype.json)을 읽지 못했습니다.");
}

// 패키지 안의 경로 한 조각이 프로젝트 밖으로 나가거나 숨김·비밀 파일을 가리키지 않는지 본다.
function isSafeRelativePath(value: string) {
  if (!value || value.length > 240 || /[\\:\x00-\x1f]/.test(value) || value.startsWith("/")) return false;
  return value.split("/").every((part) => (
    part && part !== "." && part !== ".." && !/[. ]$/.test(part) &&
    !/^(\.git|\.env.*|node_modules|\.next|\.DS_Store|__MACOSX)$/i.test(part)
  ));
}

const NPM_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const NPM_RANGE = /^(\^|~|>=)?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const NODE_VERSION = /^\d+(?:\.\d+){0,2}$/;
const NO_REQUIREMENTS: PackageRequirements = { node: null, packages: [], npm: [] };

// manifest의 requires를 확인한다. 항목이 없으면 요구 사항이 없는 것이고, 모양이 어긋나면 null.
function parseRequirements(value: unknown): PackageRequirements | null {
  if (value === undefined) return NO_REQUIREMENTS;
  if (!isRecord(value) || !Array.isArray(value.packages) || !Array.isArray(value.npm) || value.packages.length > 20 || value.npm.length > 30) return null;
  if (value.node !== null && (typeof value.node !== "string" || !NODE_VERSION.test(value.node))) return null;
  const packages: PackageRequirements["packages"] = [];
  for (const item of value.packages) {
    if (!isRecord(item) || typeof item.packageId !== "string" || !PACKAGE_ID.test(item.packageId) || typeof item.minVersion !== "string" || !VERSION.test(item.minVersion)) return null;
    packages.push({ packageId: item.packageId, minVersion: item.minVersion });
  }
  const npm: PackageRequirements["npm"] = [];
  for (const item of value.npm) {
    if (!isRecord(item) || typeof item.name !== "string" || !NPM_NAME.test(item.name) || typeof item.range !== "string" || !NPM_RANGE.test(item.range)) return null;
    npm.push({ name: item.name, range: item.range });
  }
  return { node: value.node as string | null, packages, npm };
}

function parseMetadata(value: unknown, productUuid: string): PackageMetadata {
  const fail = () => new InstallerError("Store가 보낸 패키지 정보가 규격에 맞지 않습니다.");
  if (!isRecord(value) || !isRecord(value.manifest) || !isRecord(value.signature)) throw fail();
  const manifest = value.manifest;
  const signature = value.signature;
  if (typeof value.versionUuid !== "string" || !UUID.test(value.versionUuid) ||
      typeof value.sha256 !== "string" || !SHA256.test(value.sha256) ||
      typeof value.size !== "number" || !Number.isInteger(value.size) || value.size <= 0 || value.size > MAX_PACKAGE_BYTES ||
      typeof signature.algorithm !== "string" || typeof signature.keyId !== "string" || typeof signature.value !== "string" ||
      manifest.schemaVersion !== 1 || manifest.type !== "plextype-extension" ||
      manifest.productUuid !== productUuid ||
      typeof manifest.packageId !== "string" || !PACKAGE_ID.test(manifest.packageId) || manifest.packageId.length > 80 ||
      manifest.installPath !== `${PACKAGES_DIRECTORY}/${manifest.packageId}` ||
      typeof manifest.version !== "string" || !VERSION.test(manifest.version) ||
      typeof manifest.minPlatformVersion !== "string" || !VERSION.test(manifest.minPlatformVersion) ||
      (manifest.maxPlatformVersion !== null && (typeof manifest.maxPlatformVersion !== "string" || !VERSION.test(manifest.maxPlatformVersion))) ||
      typeof manifest.requiresDatabaseReview !== "boolean" ||
      !parseRequirements(manifest.requires) ||
      !Array.isArray(manifest.files) || manifest.files.length === 0 || manifest.files.length > MAX_ENTRIES) throw fail();
  for (const file of manifest.files) {
    if (!isRecord(file) || typeof file.path !== "string" || !isSafeRelativePath(file.path) ||
        typeof file.size !== "number" || !Number.isInteger(file.size) || file.size < 0 || file.size > MAX_FILE_BYTES ||
        typeof file.sha256 !== "string" || !SHA256.test(file.sha256)) throw fail();
  }
  return value as unknown as PackageMetadata;
}

// Store(src/extensions/store/package.ts)가 서명할 때 쓰는 것과 같은 직렬화. 키 순서와 무관하게 같은 바이트가 나온다.
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return "{" + Object.keys(object).sort().map((key) => JSON.stringify(key) + ":" + canonical(object[key])).join(",") + "}";
  }
  return JSON.stringify(value);
};

export function verifyPackageSignature(metadata: PackageMetadata, keys: StoreKey[]) {
  if (metadata.signature.algorithm !== "Ed25519") return false;
  const key = keys.find((item) => item.keyId === metadata.signature.keyId);
  if (!key) return false;
  const payload = Buffer.from(canonical({ manifest: metadata.manifest, sha256: metadata.sha256, size: metadata.size }));
  try { return verify(null, payload, key.publicKey, Buffer.from(metadata.signature.value, "base64")); }
  catch { return false; }
}

// ZIP의 중앙 디렉터리를 읽어 파일 이름과 내용을 돌려준다. 압축 방식은 저장(0)과 deflate(8)만 받는다.
// 서명으로 전체 바이트를 확인한 뒤에 부르지만, 형식이 어긋난 파일은 그대로 거절한다.
export function readZipEntries(bytes: Buffer): Map<string, Buffer> {
  const fail = (reason: string) => new InstallerError(`패키지 ZIP을 읽지 못했습니다: ${reason}`);
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 22 - 0xffff); offset--) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) { end = offset; break; }
  }
  if (end < 0) throw fail("ZIP 형식이 아닙니다.");
  const count = bytes.readUInt16LE(end + 10);
  const directorySize = bytes.readUInt32LE(end + 12);
  let cursor = bytes.readUInt32LE(end + 16);
  if (count === 0xffff || directorySize === 0xffffffff || cursor === 0xffffffff) throw fail("지원하지 않는 ZIP64 형식입니다.");
  if (count > MAX_ENTRIES || cursor + directorySize > end) throw fail("항목 정보가 올바르지 않습니다.");

  const files = new Map<string, Buffer>();
  const seen = new Set<string>();
  let expanded = 0;
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > end || bytes.readUInt32LE(cursor) !== 0x02014b50) throw fail("항목 정보가 올바르지 않습니다.");
    const flags = bytes.readUInt16LE(cursor + 8);
    const method = bytes.readUInt16LE(cursor + 10);
    const compressedSize = bytes.readUInt32LE(cursor + 20);
    const size = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const mode = (bytes.readUInt32LE(cursor + 38) >>> 16) & 0o170000;
    const localOffset = bytes.readUInt32LE(cursor + 42);
    const name = bytes.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    cursor += 46 + nameLength + extraLength + commentLength;

    const directory = name.endsWith("/");
    const plain = directory ? name.slice(0, -1) : name;
    // 암호화된 항목, 링크·장치 파일, 프로젝트 밖을 가리키는 경로는 받지 않는다.
    if ((flags & 1) !== 0 || (mode !== 0 && mode !== 0o100000 && mode !== 0o040000) || !isSafeRelativePath(plain)) {
      throw fail("위험한 경로나 지원하지 않는 항목이 있습니다.");
    }
    // 대소문자를 구분하지 않는 파일 시스템에서 서로 덮어쓰지 않게 한다.
    const key = plain.normalize("NFC").toLowerCase();
    if (seen.has(key)) throw fail("중복된 경로가 있습니다.");
    seen.add(key);
    if (directory) continue;

    if (size > MAX_FILE_BYTES || (expanded += size) > MAX_EXPANDED_BYTES) throw fail("압축 해제 크기 제한을 넘었습니다.");
    if (localOffset + 30 > bytes.length || bytes.readUInt32LE(localOffset) !== 0x04034b50) throw fail("항목 정보가 올바르지 않습니다.");
    const start = localOffset + 30 + bytes.readUInt16LE(localOffset + 26) + bytes.readUInt16LE(localOffset + 28);
    if (start + compressedSize > bytes.length) throw fail("항목 정보가 올바르지 않습니다.");
    const data = bytes.subarray(start, start + compressedSize);
    let content: Buffer;
    if (method === 0) content = Buffer.from(data);
    else if (method === 8) {
      try { content = inflateRawSync(data, { maxOutputLength: MAX_FILE_BYTES }); }
      catch { throw fail("압축을 풀지 못했습니다."); }
    } else throw fail("지원하지 않는 압축 방식입니다.");
    if (content.length !== size) throw fail("항목 크기가 맞지 않습니다.");
    files.set(name, content);
  }
  return files;
}

const adapterExports = (entry: RouteEntry) => entry.exports ?? [entry.route.endsWith("/route.ts") ? "GET" : "default"];

// scripts/extension-files.mjs의 renderExtensionRoute와 같은 내용을 만든다. 두 곳의 결과가 다르면 `npm run extensions:check`가 실패한다.
export function renderRouteAdapter(entry: RouteEntry) {
  const modulePath = "@/" + entry.implementation.slice("src/".length).replace(/\.(tsx|ts)$/, "");
  return [ADAPTER_HEADERS[0], ...entry.configs, `export { ${adapterExports(entry).join(", ")} } from "${modulePath}";`, ""].join("\n");
}

// 패키지 안의 routes.json들을 읽어, 만들 연결 파일 목록을 돌려준다. `files`의 키는 패키지 폴더 기준 상대 경로다.
function readPackageRoutes(packageId: string, files: Map<string, Buffer>): RouteEntry[] {
  const fail = () => new InstallerError("패키지의 routes.json이 규격에 맞지 않습니다.");
  const routes: RouteEntry[] = [];
  const destinations = new Set<string>();
  for (const [name, content] of files) {
    if (name !== "routes.json" && !name.endsWith("/routes.json")) continue;
    let entries: unknown;
    try { entries = JSON.parse(content.toString("utf8")); }
    catch { throw fail(); }
    if (!Array.isArray(entries)) throw fail();
    const owner = path.posix.join(PACKAGES_DIRECTORY, packageId, path.posix.dirname(name)).replace(/\/\.$/, "");
    for (const entry of entries) {
      if (!isRecord(entry) || typeof entry.route !== "string" || typeof entry.implementation !== "string" ||
          !entry.route.startsWith("src/app/") || !/\/(page|layout|route|loading|error|not-found|template|default)\.tsx?$/.test(entry.route) ||
          !isSafeRelativePath(entry.route) ||
          !entry.implementation.startsWith(owner + "/") || !isSafeRelativePath(entry.implementation) ||
          !files.has(entry.implementation.slice(`${PACKAGES_DIRECTORY}/${packageId}/`.length)) ||
          !Array.isArray(entry.configs) || !entry.configs.every((config) => typeof config === "string" && ROUTE_CONFIG.test(config)) ||
          (entry.exports !== undefined && (!Array.isArray(entry.exports) || entry.exports.length === 0 || !entry.exports.every((item) => typeof item === "string" && ROUTE_EXPORT.test(item))))) {
        throw fail();
      }
      const destination = entry.route.toLowerCase();
      if (destinations.has(destination)) throw fail();
      destinations.add(destination);
      routes.push({ route: entry.route, implementation: entry.implementation, configs: entry.configs as string[], ...(entry.exports ? { exports: entry.exports as string[] } : {}) });
    }
  }
  return routes;
}

async function readText(filePath: string) {
  try { return await fs.readFile(filePath, "utf8"); }
  catch { return null; }
}

// 이미 설치된 패키지 폴더에서 설치 정보와 연결 파일 목록을 읽는다. 쉬운설치로 넣은 폴더가 아니면 null.
async function readInstalled(root: string, packageId: string) {
  const directory = path.join(root, PACKAGES_DIRECTORY, packageId);
  const raw = await readText(path.join(directory, "plextype.package.json"));
  if (raw === null) return null;
  let manifest: unknown;
  try { manifest = JSON.parse(raw); }
  catch { return null; }
  if (!isRecord(manifest) || manifest.packageId !== packageId || typeof manifest.productUuid !== "string" || typeof manifest.version !== "string" || !Array.isArray(manifest.files)) return null;
  const routes: string[] = [];
  for (const file of manifest.files) {
    if (!isRecord(file) || typeof file.path !== "string" || !isSafeRelativePath(file.path)) continue;
    if (file.path !== "routes.json" && !file.path.endsWith("/routes.json")) continue;
    try {
      const entries = JSON.parse(await fs.readFile(path.join(directory, file.path), "utf8")) as unknown;
      if (Array.isArray(entries)) {
        for (const entry of entries) {
          if (isRecord(entry) && typeof entry.route === "string" && entry.route.startsWith("src/app/") && isSafeRelativePath(entry.route)) routes.push(entry.route);
        }
      }
    } catch { /* 읽지 못한 routes.json의 연결 파일은 건드리지 않는다. */ }
  }
  const migrations = manifest.files.flatMap((file) => {
    const match = isRecord(file) && typeof file.path === "string" ? MIGRATION_FILE.exec(file.path) : null;
    return match ? [match[1]] : [];
  });
  return { directory, productUuid: manifest.productUuid, version: manifest.version, routes, migrations, requires: parseRequirements(manifest.requires) ?? NO_REQUIREMENTS };
}

// 연결 파일이 이 패키지의 것인지 본다: 설치기가 만든 형식이고 이 패키지 폴더의 구현을 가리켜야 한다.
const isOwnedAdapter = (content: string, packageId: string) => (
  ADAPTER_HEADERS.some((header) => content.startsWith(header)) && content.includes(`from "@/packages/${packageId}/`)
);

// 설치된 패키지가 루트에 둔 등록 파일을 모아 src/packages의 목록 두 개를 다시 만든다.
// - index.ts: registry.ts(x)의 관리자 메뉴·스킨. 코어 레지스트리(coreRegistry.tsx)가 읽는다.
// - installedTriggers.ts: triggers.ts의 트리거. 트리거 허브(triggerHub.ts)가 읽는다.
// - installedLoginProviders.ts: loginProviders.ts(x)의 로그인 수단. 로그인 화면(core/utils/auth/loginProviders.ts)이 읽는다.
// 트리거와 로그인 수단은 서버 코드라, 화면 쪽에서도 불러오는 index.ts와 섞지 않고 따로 둔다.
// 폴더의 지금 상태에서 만들므로, 설치·제거가 끝났든 중간에 되돌렸든 부르고 나면 목록이 폴더와 맞는다.
// registry 파일로 등록된 패키지 ID를 돌려준다.
export async function writePackageRegistry(root: string) {
  const directory = path.join(root, PACKAGES_DIRECTORY);
  let entries: Dirent[] = [];
  try { entries = await fs.readdir(directory, { withFileTypes: true }); }
  catch { /* 폴더가 아직 없으면 등록할 것도 없다. */ }
  const installed: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory() && PACKAGE_ID.test(entry.name) && (await readInstalled(root, entry.name))) installed.push(entry.name);
  }
  const adopted = (await listAdoptedPackages(root)).map((item) => item.packageId);
  const hasFile = async (folder: string, files: string[]) => {
    for (const file of files) {
      if ((await fs.lstat(path.join(folder, file)).catch(() => null))?.isFile()) return true;
    }
    return false;
  };
  const collect = async (name: string, files: string[]) => {
    const own: string[] = [];
    for (const packageId of installed) {
      if (await hasFile(path.join(directory, packageId), files)) own.push(packageId);
    }
    // 내 확장으로 가져온 패키지도 기록 파일과 등록 파일이 남아 있는 동안은 여기서 등록한다.
    // 가져온 순간 관리자 메뉴나 스킨, 트리거가 사라지지 않게 하기 위함이며, 기록 파일을 지우면 설치기는 더 관여하지 않는다.
    const specifiers = own.map((packageId) => `./${packageId}/${name}`);
    for (const packageId of adopted) {
      if (await hasFile(path.join(root, EXTENSIONS_DIRECTORY, packageId), files)) specifiers.push(`@/extensions/${packageId}/${name}`);
    }
    return { own, specifiers };
  };
  const render = (specifiers: string[], typeImport: string, declaration: string) => [
    "// 쉬운 설치가 만드는 파일. 직접 고치지 않는다. 패키지를 설치·제거하거나 내 확장으로 가져올 때마다 다시 만든다.",
    typeImport,
    ...specifiers.map((specifier, index) => `import package${index} from "${specifier}";`),
    "",
    `${declaration} = [${specifiers.map((_, index) => `package${index}`).join(", ")}];`,
    "",
  ].join("\n");

  const registries = await collect("registry", ["registry.ts", "registry.tsx"]);
  const triggers = await collect("triggers", ["triggers.ts"]);
  const loginProviders = await collect("loginProviders", ["loginProviders.ts", "loginProviders.tsx"]);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, "index.ts"), render(
    registries.specifiers,
    'import type { ExtensionRegistryConfig } from "@/core/registry/define";',
    "export const installedPackages: ExtensionRegistryConfig[]",
  ));
  await fs.writeFile(path.join(directory, "installedTriggers.ts"), render(
    triggers.specifiers,
    'import type { PackageTriggers } from "@/core/utils/trigger/define";',
    "export const installedTriggers: PackageTriggers[]",
  ));
  await fs.writeFile(path.join(directory, "installedLoginProviders.ts"), render(
    loginProviders.specifiers,
    'import type { LoginProviderSource } from "@/core/registry/defineLoginProviders";',
    "export const installedLoginProviders: LoginProviderSource[]",
  ));
  return registries.own;
}

async function assertRealDirectory(directory: string, label: string) {
  try {
    const stat = await fs.lstat(directory);
    if (stat.isDirectory() && !stat.isSymbolicLink()) return;
  } catch { /* 아래에서 알린다. */ }
  throw new InstallerError(`${label} 폴더를 찾지 못했습니다. Plextype 프로젝트 루트에서 실행해주세요.`);
}

// 패키지를 내려받아 서명, 무결성, 호환 버전, 설치할 자리를 모두 확인한다. 여기서는 아무것도 쓰지 않는다.
async function loadVerifiedPackage(root: string, productUuid: string, options: { versionUuid?: string } = {}) {
  assertInstallAllowed();
  if (!UUID.test(productUuid) || (options.versionUuid && !UUID.test(options.versionUuid))) throw new InstallerError("설치할 자료를 찾지 못했습니다.");
  const connection = await readConnection(root);
  if (!connection) throw new InstallerError("먼저 Store에 연결해주세요.");
  await fs.mkdir(path.join(root, PACKAGES_DIRECTORY), { recursive: true });
  await assertRealDirectory(path.join(root, PACKAGES_DIRECTORY), PACKAGES_DIRECTORY);
  await assertRealDirectory(path.join(root, "src", "app"), "src/app");

  const download = `/api/store/products/${encodeURIComponent(productUuid)}/download`;
  const pinned = options.versionUuid ? `&version=${encodeURIComponent(options.versionUuid)}` : "";
  const metadata = parseMetadata(await storeJson(connection.storeUrl, `${download}?metadata=1${pinned}`, connection.token), productUuid);
  const { manifest } = metadata;
  if (!verifyPackageSignature(metadata, connection.keys)) {
    throw new InstallerError("패키지 서명을 확인하지 못했습니다. 연결 관리에서 서명 키를 새로 받은 뒤 다시 시도해주세요.");
  }

  const platform = await readPlatformVersion(root);
  if (compareVersions(platform, manifest.minPlatformVersion) < 0 || (manifest.maxPlatformVersion && compareVersions(platform, manifest.maxPlatformVersion) > 0)) {
    throw new InstallerError(`이 패키지는 Plextype ${manifest.minPlatformVersion} ~ ${manifest.maxPlatformVersion || "최신"}용입니다. 현재 버전은 ${platform}입니다.`);
  }

  const target = path.join(root, PACKAGES_DIRECTORY, manifest.packageId);
  const installed = await readInstalled(root, manifest.packageId);
  let targetExists = true;
  try { await fs.lstat(target); } catch { targetExists = false; }
  if (targetExists && (!installed || installed.productUuid !== productUuid)) {
    throw new InstallerError(`${PACKAGES_DIRECTORY}/${manifest.packageId} 폴더가 이미 있고 이 자료로 설치한 것이 아닙니다. 덮어쓰지 않습니다.`);
  }

  const response = await storeRequest(connection.storeUrl, `${download}?version=${encodeURIComponent(metadata.versionUuid)}`, connection.token);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== metadata.size || sha256(bytes) !== metadata.sha256) {
    throw new InstallerError("내려받은 파일이 서명된 패키지와 다릅니다. 다시 시도해주세요.");
  }

  // ZIP 안에는 `<packageId>/` 폴더 하나만 있고, 설치 정보 파일을 뺀 나머지가 서명된 파일 목록과 정확히 같아야 한다.
  const prefix = manifest.packageId + "/";
  const files = new Map<string, Buffer>();
  for (const [name, content] of readZipEntries(bytes)) {
    if (!name.startsWith(prefix)) throw new InstallerError("패키지 내용이 서명된 파일 목록과 다릅니다.");
    if (name !== prefix + "plextype.package.json") files.set(name.slice(prefix.length), content);
  }
  if (files.size !== manifest.files.length || manifest.files.some((file) => {
    const content = files.get(file.path);
    return !content || content.length !== file.size || sha256(content) !== file.sha256;
  })) throw new InstallerError("패키지 내용이 서명된 파일 목록과 다릅니다.");

  const routes = readPackageRoutes(manifest.packageId, files);
  return { metadata, manifest, files, routes, installed, target };
}

const MIGRATION_FILE = /(?:^|\/)prisma\/migrations\/(\d{14}_[A-Za-z0-9_-]+)\/migration\.sql$/;
// 화면에 보여 줄 SQL 길이. 넘는 부분은 잘라서 보여 주고 잘렸다고 알린다.
const MAX_PREVIEW_SQL = 20_000;

// 이 패키지를 설치하면 새로 들어오는 마이그레이션. 이미 설치된 버전에 있던 것은 뺀다.
async function findNewMigrations(target: string, files: Map<string, Buffer>, installed: boolean) {
  const migrations: { name: string; file: string; content: Buffer }[] = [];
  for (const [file, content] of files) {
    const match = MIGRATION_FILE.exec(file);
    if (!match) continue;
    if (installed && (await readText(path.join(target, file))) !== null) continue;
    migrations.push({ name: match[1], file, content });
  }
  return migrations.sort((left, right) => left.name.localeCompare(right.name));
}

type LoadedPackage = Awaited<ReturnType<typeof loadVerifiedPackage>>;

async function listInstalledPackageIds(root: string) {
  let entries: Dirent[] = [];
  try { entries = await fs.readdir(path.join(root, PACKAGES_DIRECTORY), { withFileTypes: true }); }
  catch { /* 폴더가 없으면 설치된 것도 없다. */ }
  return entries.filter((entry) => entry.isDirectory() && PACKAGE_ID.test(entry.name)).map((entry) => entry.name).sort();
}

const parseVersion = (value: string) => value.split(".").map(Number);

// 버전이 범위를 만족하는지. 범위는 Store가 받는 네 가지 모양(1.2.3, ^1.2.3, ~1.2.3, >=1.2.3)뿐이다.
export function satisfiesRange(version: string, range: string) {
  const match = NPM_RANGE.exec(range);
  // 프리릴리스 꼬리표("-beta.1")는 떼고 숫자 부분만 본다.
  const core = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match || !core) return false;
  const have = [Number(core[1]), Number(core[2]), Number(core[3])];
  const want = [Number(match[2]), Number(match[3]), Number(match[4])];
  const order = compareVersions(have.join("."), want.join("."));
  if (match[1] === ">=") return order >= 0;
  if (match[1] === "~") return order >= 0 && have[0] === want[0] && have[1] === want[1];
  if (match[1] === "^") {
    // npm과 같은 규칙: 0이 아닌 가장 왼쪽 자리가 같아야 한다.
    if (want[0] > 0) return order >= 0 && have[0] === want[0];
    if (want[1] > 0) return order >= 0 && have[0] === 0 && have[1] === want[1];
    return order === 0;
  }
  return order === 0;
}

const hasFile = (filePath: string) => fs.access(filePath).then(() => true, () => false);

// 필요한 npm 라이브러리가 프로젝트에 있는지 본다. 설치는 하지 않고, 없는 것을 넣는 명령을 만들어 준다.
// 외부 코드를 받아 실행하는 일이라 설치기가 대신 하지 않고 사람이 실행하게 한다.
async function checkNpmRequirements(root: string, requirements: PackageRequirements["npm"]) {
  const missing: { name: string; range: string }[] = [];
  const conflicts: { name: string; range: string; installed: string }[] = [];
  // 프로젝트 전용 라이브러리는 src/extensions/package.json(workspace)에 둔다. 없으면 루트에 둔다.
  const workspace = await hasFile(path.join(root, "src", "extensions", "package.json"));
  for (const item of requirements) {
    let installed: string | null = null;
    for (const base of [path.join(root, "node_modules"), path.join(root, "src", "extensions", "node_modules")]) {
      const raw = await readText(path.join(base, ...item.name.split("/"), "package.json"));
      if (raw === null) continue;
      try {
        const value = JSON.parse(raw) as unknown;
        if (isRecord(value) && typeof value.version === "string") { installed = value.version; break; }
      } catch { /* 읽지 못한 것은 없는 것으로 본다. */ }
    }
    if (installed === null) missing.push(item);
    else if (!satisfiesRange(installed, item.range)) conflicts.push({ ...item, installed });
  }
  // 이름과 범위는 정해진 글자만 통과한 값이라 그대로 명령에 넣어도 된다. ^와 >는 셸이 해석하지 않게 따옴표로 감싼다.
  const command = missing.length > 0
    ? `npm install ${missing.map((item) => `"${item.name}@${item.range}"`).join(" ")}${workspace ? " -w src/extensions" : ""}`
    : null;
  return { missing, conflicts, command };
}

// 필요한 패키지를 따라가는 깊이 한도. Store가 순환을 거절하지만, 그와 무관하게 여기서도 끝을 둔다.
const MAX_DEPENDENCY_DEPTH = 10;

// 이 자료를 설치하려면 함께 설치해야 하는 패키지를 찾아 설치 순서대로 늘어놓는다. 아무것도 쓰지 않는다.
// 설치를 막는 사유(blockers)가 있으면 순서를 만들었더라도 설치하면 안 된다.
async function planInstall(root: string, productUuid: string, options: { versionUuid?: string } = {}) {
  const target = await loadVerifiedPackage(root, productUuid, options);
  if (await readAdopted(root, target.manifest.packageId)) {
    throw new InstallerError(`${target.manifest.packageId}은(는) 내 확장으로 가져온 패키지라 설치하지 않습니다. 새 버전은 참고용으로 받아 직접 반영하거나, 가져오기를 취소한 뒤 설치해주세요.`);
  }
  const steps: LoadedPackage[] = [];
  const blockers: string[] = [];
  const planned = new Map<string, string>([[target.manifest.packageId, target.manifest.version]]);
  let catalog: CatalogProduct[] | null = null;

  const visit = async (loaded: LoadedPackage, depth: number) => {
    for (const need of loaded.manifest.requires?.packages ?? []) {
      const label = `${loaded.manifest.packageId}에 필요한 ${need.packageId} ${need.minVersion} 이상`;
      // 내 확장으로 가져온 패키지는 그 확장이 따르는 버전으로 설치된 것과 같이 본다.
      const adopted = await readAdopted(root, need.packageId);
      const have = planned.get(need.packageId) ?? adopted?.version ?? (await readInstalled(root, need.packageId))?.version;
      if (have && compareVersions(have, need.minVersion) >= 0) continue;
      if (adopted) { blockers.push(`${label}이 필요한데, 내 확장으로 가져온 ${need.packageId}은(는) ${adopted.version} 기준입니다. 새 버전을 반영하고 기준 버전을 올려주세요.`); continue; }
      if (planned.has(need.packageId)) { blockers.push(`${label}을(를) 맞출 수 없습니다. 함께 설치될 버전은 ${have}입니다.`); continue; }
      if (depth >= MAX_DEPENDENCY_DEPTH) { blockers.push(`${label}: 필요한 패키지가 너무 깊이 이어집니다.`); continue; }
      const connection = await readConnection(root);
      catalog ??= await fetchCatalog(connection!.storeUrl);
      const product = catalog.find((item) => item.packageId === need.packageId);
      if (!product) { blockers.push(`${label}을(를) Store에서 찾지 못했습니다.`); continue; }
      if (compareVersions(product.version, need.minVersion) < 0) { blockers.push(`${label}이 필요하지만 Store의 최신 버전은 ${product.version}입니다.`); continue; }
      let child: LoadedPackage;
      try { child = await loadVerifiedPackage(root, product.productUuid); }
      catch (error) {
        if (!(error instanceof InstallerError)) throw error;
        blockers.push(`${need.packageId}: ${error.message}`);
        continue;
      }
      planned.set(need.packageId, child.manifest.version);
      await visit(child, depth + 1);
      steps.push(child);
    }
  };
  await visit(target, 0);
  steps.push(target);

  const currentNode = process.versions.node;
  let requiredNode: string | null = null;
  const npm = new Map<string, { name: string; range: string }>();
  for (const step of steps) {
    const requires = step.manifest.requires ?? NO_REQUIREMENTS;
    if (requires.node) {
      const padded = [...parseVersion(requires.node), 0, 0].slice(0, 3).join(".");
      if (!requiredNode || compareVersions(padded, requiredNode) > 0) requiredNode = padded;
    }
    // 같은 라이브러리를 여러 패키지가 요구하면 먼저 나온 범위로 점검하고, 맞지 않는 쪽은 충돌로 드러난다.
    for (const item of requires.npm) if (!npm.has(`${item.name}@${item.range}`)) npm.set(`${item.name}@${item.range}`, item);
  }
  if (requiredNode && compareVersions(currentNode.split("-")[0], requiredNode) < 0) {
    blockers.push(`Node ${requiredNode} 이상이 필요합니다. 현재 버전은 ${currentNode}입니다.`);
  }
  // 업데이트되는 패키지 가운데 설치 후 사람이 고친 파일이 있는 것. 업데이트하면 그 수정이 사라진다.
  const localChanges: { packageId: string; files: LocalChange[] }[] = [];
  for (const step of steps) {
    const files = step.installed ? await findLocalChanges(root, step.manifest.packageId) : [];
    if (files.length > 0) localChanges.push({ packageId: step.manifest.packageId, files });
  }
  return { target, steps, blockers, localChanges, node: { required: requiredNode, current: currentNode }, npm: await checkNpmRequirements(root, [...npm.values()]) };
}

export type PackagePreview = {
  productUuid: string;
  // 미리 본 것과 같은 버전을 설치하도록 설치할 때 그대로 넘긴다.
  versionUuid: string;
  packageId: string;
  version: string;
  previousVersion: string | null;
  // 설치를 막는 사유. 하나라도 있으면 설치할 수 없다.
  blockers: string[];
  node: { required: string | null; current: string };
  // 필요해서 함께 설치하거나 업데이트할 패키지. 설치 순서대로다.
  alsoInstalls: { packageId: string; version: string; previousVersion: string | null; versionUuid: string }[];
  // 프로젝트에 없거나 버전이 맞지 않는 npm 라이브러리. 없는 것은 command로 직접 설치한다.
  npm: { missing: { name: string; range: string }[]; conflicts: { name: string; range: string; installed: string }[]; command: string | null };
  // 설치 후 직접 고친 파일이 있는 패키지. 업데이트하면 이 수정이 사라진다(이전 폴더는 백업에 남는다).
  localChanges: { packageId: string; files: LocalChange[] }[];
  // 함께 설치되는 것을 포함해 prisma 스키마나 SQL 파일이 들어 있는지.
  hasDatabaseFiles: boolean;
  // 설치하면 DB에 새로 적용될 마이그레이션과 그 SQL.
  migrations: { packageId: string; name: string; sql: string; truncated: boolean }[];
};

// 설치하기 전에, 무엇이 함께 설치되고 DB에 무엇을 하며 무엇이 모자란지 보여 주기 위해 점검만 한다.
export async function previewStorePackage(root: string, productUuid: string): Promise<PackagePreview> {
  const plan = await planInstall(root, productUuid);
  const migrations: PackagePreview["migrations"] = [];
  for (const step of plan.steps) {
    for (const { name, content } of await findNewMigrations(step.target, step.files, Boolean(step.installed))) {
      const sql = content.toString("utf8");
      migrations.push({ packageId: step.manifest.packageId, name, sql: sql.slice(0, MAX_PREVIEW_SQL), truncated: sql.length > MAX_PREVIEW_SQL });
    }
  }
  const { target } = plan;
  return {
    productUuid,
    versionUuid: target.metadata.versionUuid,
    packageId: target.manifest.packageId,
    version: target.manifest.version,
    previousVersion: target.installed?.version ?? null,
    blockers: plan.blockers,
    node: plan.node,
    alsoInstalls: plan.steps.slice(0, -1).map((step) => ({
      packageId: step.manifest.packageId,
      version: step.manifest.version,
      previousVersion: step.installed?.version ?? null,
      versionUuid: step.metadata.versionUuid,
    })),
    npm: plan.npm,
    localChanges: plan.localChanges,
    hasDatabaseFiles: plan.steps.some((step) => step.manifest.requiresDatabaseReview),
    migrations,
  };
}

// 자료와, 그 자료가 필요로 하는 패키지를 순서대로 설치한다. 점검에서 막힌 사유가 있으면 아무것도 설치하지 않는다.
// expected는 미리 본 뒤 Store의 버전이 바뀌지 않았는지 확인하는 데 쓴다: 패키지 ID → 미리 본 버전의 UUID.
export async function installStorePackage(
  root: string,
  productUuid: string,
  options: { versionUuid?: string; expected?: Record<string, string>; overwriteLocalChanges?: boolean } = {},
): Promise<InstallResult> {
  const plan = await planInstall(root, productUuid, { versionUuid: options.versionUuid });
  if (plan.blockers.length > 0) throw new InstallerError(plan.blockers.join("\n"));
  // 직접 고친 파일을 덮어쓰는 것은 그 사실을 본 뒤에 명시적으로 허락했을 때만 한다.
  if (plan.localChanges.length > 0 && !options.overwriteLocalChanges) {
    throw new InstallerError(`직접 고친 파일이 있어 업데이트하지 않았습니다: ${plan.localChanges.map((item) => `${item.packageId} ${item.files.length}개`).join(", ")}. 내용을 확인한 뒤 덮어쓰기를 선택하거나, 패키지를 내 확장으로 가져와주세요.`);
  }
  if (options.expected && plan.steps.some((step) => options.expected![step.manifest.packageId] !== step.metadata.versionUuid)) {
    throw new InstallerError("확인한 뒤에 Store의 버전이 바뀌었습니다. 다시 설치를 눌러 내용을 확인해주세요.");
  }

  const results: InstallResult[] = [];
  try {
    for (const step of plan.steps) results.push(await writeVerifiedPackage(root, step));
  } catch (error) {
    // 중간에 실패하면 이번에 새로 넣은 패키지는 다시 뺀다. 업데이트한 것은 새 버전으로 남는다.
    for (const done of results.reverse()) {
      if (!done.previousVersion) await uninstallStorePackage(root, done.packageId).catch(() => {});
    }
    throw error;
  }
  const result = results[results.length - 1];
  const others = results.slice(0, -1);
  return {
    ...result,
    requiresDatabaseReview: results.some((item) => item.requiresDatabaseReview),
    newMigrations: results.flatMap((item) => item.newMigrations),
    alsoInstalled: others.map(({ packageId, version, previousVersion }) => ({ packageId, version, previousVersion })),
  };
}

async function writeVerifiedPackage(root: string, loaded: LoadedPackage): Promise<InstallResult> {
  const { manifest, files, routes, installed, target } = loaded;
  const newMigrations = (await findNewMigrations(target, files, Boolean(installed))).map((item) => item.name);
  // 손으로 쓴 라우트나 다른 확장의 라우트와 겹치면 아무것도 쓰기 전에 멈춘다.
  const previousAdapters = new Map<string, string | null>();
  for (const entry of routes) {
    const current = await readText(path.join(root, entry.route));
    if (current !== null && !isOwnedAdapter(current, manifest.packageId)) {
      throw new InstallerError(`${entry.route}가 이미 있고 이 패키지의 것이 아닙니다. 덮어쓰지 않습니다.`);
    }
    previousAdapters.set(entry.route, current);
  }
  // 이전 버전에는 있었지만 새 버전에서 빠진 연결 파일은 지운다. 남겨 두면 없는 구현을 가리켜 빌드가 깨진다.
  for (const route of installed?.routes ?? []) {
    if (previousAdapters.has(route)) continue;
    const current = await readText(path.join(root, route));
    if (current !== null && isOwnedAdapter(current, manifest.packageId)) previousAdapters.set(route, current);
  }

  const stamp = `${manifest.packageId}-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const staging = statePath(root, "tmp", stamp);
  const backup = statePath(root, "backup", stamp);
  let moved = false;
  let placed = false;
  try {
    for (const [name, content] of files) {
      const destination = path.join(staging, name);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, content, { flag: "wx" });
    }
    await fs.writeFile(path.join(staging, "plextype.package.json"), JSON.stringify(manifest, null, 2) + "\n", { flag: "wx" });

    if (installed) {
      await fs.mkdir(path.dirname(backup), { recursive: true });
      await fs.rename(target, backup);
      moved = true;
    }
    await fs.rename(staging, target);
    placed = true;

    const wanted = new Map(routes.map((entry) => [entry.route, renderRouteAdapter(entry)]));
    for (const route of previousAdapters.keys()) {
      const destination = path.join(root, route);
      const content = wanted.get(route);
      if (content === undefined) await fs.rm(destination, { force: true });
      else {
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, content);
      }
    }
  } catch (error) {
    // 중간에 실패하면 설치 전 상태로 되돌린다.
    for (const [route, content] of previousAdapters) {
      const destination = path.join(root, route);
      if (content === null) await fs.rm(destination, { force: true }).catch(() => {});
      else await fs.writeFile(destination, content).catch(() => {});
    }
    if (placed) await fs.rm(target, { recursive: true, force: true }).catch(() => {});
    if (moved) await fs.rename(backup, target).catch(() => {});
    await fs.rm(staging, { recursive: true, force: true }).catch(() => {});
    await writePackageRegistry(root).catch(() => {});
    if (error instanceof InstallerError) throw error;
    throw new InstallerError("파일을 쓰는 중 오류가 나서 설치 전 상태로 되돌렸습니다. 폴더 권한을 확인해주세요.");
  }

  const registered = await writePackageRegistry(root);
  return {
    packageId: manifest.packageId,
    version: manifest.version,
    previousVersion: installed?.version ?? null,
    installPath: manifest.installPath,
    routes: routes.map((entry) => entry.route),
    registered: registered.includes(manifest.packageId),
    newMigrations,
    alsoInstalled: [],
    requiresDatabaseReview: manifest.requiresDatabaseReview,
  };
}

// 쉬운설치로 넣은 패키지를 뺀다. 폴더는 지우지 않고 `.plextype/backup`으로 옮겨, 잘못 뺐을 때 되돌릴 수 있게 한다.
export async function uninstallStorePackage(root: string, packageId: string) {
  assertInstallAllowed();
  if (!PACKAGE_ID.test(packageId)) throw new InstallerError("설치된 패키지를 찾지 못했습니다.");
  const installed = await readInstalled(root, packageId);
  if (!installed) throw new InstallerError("쉬운 설치로 넣은 패키지가 아니어서 제거하지 않습니다.");
  // 다른 패키지가 이것을 필요로 하면 빼지 않는다. 빼면 그 패키지가 깨진다.
  const dependents: string[] = [];
  for (const name of await listInstalledPackageIds(root)) {
    if (name !== packageId && (await readInstalled(root, name))?.requires.packages.some((item) => item.packageId === packageId)) dependents.push(name);
  }
  for (const adopted of await listAdoptedPackages(root)) {
    if (adopted.requires.packages.some((item) => item.packageId === packageId)) dependents.push(`${adopted.packageId}(내 확장)`);
  }
  if (dependents.length > 0) {
    throw new InstallerError(`${dependents.join(", ")} 패키지가 ${packageId}을(를) 필요로 합니다. 그 패키지를 먼저 제거해주세요.`);
  }
  const removedRoutes: string[] = [];
  for (const route of installed.routes) {
    const destination = path.join(root, route);
    const current = await readText(destination);
    if (current !== null && isOwnedAdapter(current, packageId)) {
      await fs.rm(destination, { force: true });
      removedRoutes.push(route);
    }
  }
  const backup = statePath(root, "backup", `${packageId}-${Date.now()}-${randomBytes(4).toString("hex")}`);
  await fs.mkdir(path.dirname(backup), { recursive: true });
  await fs.rename(installed.directory, backup);
  await writePackageRegistry(root);
  return {
    packageId,
    version: installed.version,
    routes: removedRoutes,
    backupPath: path.relative(root, backup).split(path.sep).join("/"),
    // 이 패키지가 가져왔던 마이그레이션. 폴더를 빼도 DB의 테이블과 적용 이력은 그대로 남는다.
    migrations: installed.migrations,
  };
}

// ---------------------------------------------------------------------------------------------
// 직접 고친 패키지 다루기
//
// 패키지를 고쳐 쓰는 길은 둘이다.
// - 등록 단위(스킨의 화면, 레이아웃, 메뉴)만 바꿀 때: src/extensions에서 같은 key로 등록한다. 패키지는 그대로라 업데이트를 계속 받는다.
// - 패키지 안쪽까지 고칠 때: 패키지를 src/extensions로 가져와 내 확장으로 만든다(adoptStorePackage).
//   그 뒤로 설치기는 그 폴더를 덮어쓰지 않으며, 새 버전은 알리기만 하고 반영은 사람이 한다.
// 그 밖에 src/packages 안의 파일을 직접 고친 경우는 업데이트 전에 알려, 모르는 사이에 덮어쓰지 않게 한다.
// ---------------------------------------------------------------------------------------------

const ADOPTED_FILE = "plextype.adopted.json";
const EXTENSIONS_DIRECTORY = "src/extensions";
// 가져올 때 경로를 고쳐 쓸 글자 파일. 그 밖의 파일(이미지 등)은 내용을 건드리지 않는다.
const TEXT_FILE = /\.(tsx?|jsx?|mjs|cjs|json|css|scss|mdx?|prisma)$/i;

export type LocalChange = { path: string; change: "modified" | "removed" | "added" };

export type AdoptedPackage = {
  packageId: string;
  productUuid: string;
  // 가져온 코드가 따르고 있는 Store 버전. 새 버전을 직접 반영한 뒤 올린다.
  version: string;
  adoptedAt: string;
  requires: PackageRequirements;
};

async function walkFiles(directory: string, prefix = ""): Promise<string[]> {
  const files: string[] = [];
  let entries: Dirent[] = [];
  try { entries = await fs.readdir(path.join(directory, prefix), { withFileTypes: true }); }
  catch { return files; }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await walkFiles(directory, relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

// 설치한 뒤에 사람이 바꾼 파일. 설치할 때 기록한 파일별 해시와 지금 폴더를 비교한다.
export async function findLocalChanges(root: string, packageId: string): Promise<LocalChange[]> {
  const directory = path.join(root, PACKAGES_DIRECTORY, packageId);
  const raw = await readText(path.join(directory, "plextype.package.json"));
  if (raw === null) return [];
  let manifest: unknown;
  try { manifest = JSON.parse(raw); }
  catch { return []; }
  if (!isRecord(manifest) || !Array.isArray(manifest.files)) return [];
  const recorded = new Map<string, string>();
  for (const file of manifest.files) {
    if (isRecord(file) && typeof file.path === "string" && typeof file.sha256 === "string") recorded.set(file.path, file.sha256);
  }
  const changes: LocalChange[] = [];
  const present = new Set<string>();
  for (const file of await walkFiles(directory)) {
    if (file === "plextype.package.json") continue;
    present.add(file);
    const expected = recorded.get(file);
    if (!expected) changes.push({ path: file, change: "added" });
    else if (sha256(await fs.readFile(path.join(directory, file))) !== expected) changes.push({ path: file, change: "modified" });
  }
  for (const file of recorded.keys()) if (!present.has(file)) changes.push({ path: file, change: "removed" });
  return changes.sort((a, b) => a.path.localeCompare(b.path));
}

export async function readAdopted(root: string, packageId: string): Promise<AdoptedPackage | null> {
  if (!PACKAGE_ID.test(packageId)) return null;
  const raw = await readText(path.join(root, EXTENSIONS_DIRECTORY, packageId, ADOPTED_FILE));
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!isRecord(value) || value.schemaVersion !== 1 || value.packageId !== packageId ||
        typeof value.productUuid !== "string" || !UUID.test(value.productUuid) ||
        typeof value.version !== "string" || !VERSION.test(value.version)) return null;
    return {
      packageId,
      productUuid: value.productUuid,
      version: value.version,
      adoptedAt: typeof value.adoptedAt === "string" ? value.adoptedAt : "",
      requires: parseRequirements(value.requires) ?? NO_REQUIREMENTS,
    };
  } catch {
    return null;
  }
}

export async function listAdoptedPackages(root: string): Promise<AdoptedPackage[]> {
  let entries: Dirent[] = [];
  try { entries = await fs.readdir(path.join(root, EXTENSIONS_DIRECTORY), { withFileTypes: true }); }
  catch { /* 확장 폴더가 없으면 가져온 것도 없다. */ }
  const adopted: AdoptedPackage[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const item = entry.isDirectory() ? await readAdopted(root, entry.name) : null;
    if (item) adopted.push(item);
  }
  return adopted;
}

const writeAdopted = (root: string, adopted: AdoptedPackage) => fs.writeFile(
  path.join(root, EXTENSIONS_DIRECTORY, adopted.packageId, ADOPTED_FILE),
  JSON.stringify({ schemaVersion: 1, type: "plextype-adopted", ...adopted }, null, 2) + "\n",
);

const isAdoptedAdapter = (content: string, packageId: string) => (
  ADAPTER_HEADERS.some((header) => content.startsWith(header)) && content.includes(`from "@/extensions/${packageId}/`)
);

const referencePath = (root: string, packageId: string, version: string) => statePath(root, "reference", `${packageId}-${version}`);
const relativeToRoot = (root: string, target: string) => path.relative(root, target).split(path.sep).join("/");

// 설치한 패키지를 src/extensions로 옮겨 내 확장으로 만든다.
// 패키지 안에서 자기 위치를 가리키던 경로(import, routes.json)와 src/app의 연결 파일을 새 위치로 고치고,
// 어느 Store 패키지의 몇 버전에서 왔는지 기록 파일(plextype.adopted.json)을 남긴다.
// 옮기기 전의 모습은 .plextype/reference에 사본으로 두어, 나중에 새 버전과 비교할 수 있게 한다.
export async function adoptStorePackage(root: string, packageId: string) {
  assertInstallAllowed();
  if (!PACKAGE_ID.test(packageId)) throw new InstallerError("설치된 패키지를 찾지 못했습니다.");
  const installed = await readInstalled(root, packageId);
  if (!installed) throw new InstallerError("쉬운 설치로 넣은 패키지만 가져올 수 있습니다.");
  const destination = path.join(root, EXTENSIONS_DIRECTORY, packageId);
  if (await hasFile(destination)) throw new InstallerError(`${EXTENSIONS_DIRECTORY}/${packageId} 폴더가 이미 있어 가져올 수 없습니다.`);

  const hadLocalChanges = (await findLocalChanges(root, packageId)).length > 0;
  const reference = referencePath(root, packageId, installed.version);
  if (!(await hasFile(reference))) {
    await fs.mkdir(path.dirname(reference), { recursive: true });
    await fs.cp(installed.directory, reference, { recursive: true });
  }

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.rename(installed.directory, destination);
  await fs.rm(path.join(destination, "plextype.package.json"), { force: true });

  const moved = new RegExp(`(@/|src/)packages/${packageId}(?=[/"'\`])`, "g");
  for (const file of await walkFiles(destination)) {
    if (!TEXT_FILE.test(file)) continue;
    const target = path.join(destination, file);
    const content = await fs.readFile(target, "utf8");
    const next = content.replace(moved, `$1extensions/${packageId}`);
    if (next !== content) await fs.writeFile(target, next);
  }

  // 연결 파일은 옮긴 routes.json대로 다시 쓴다. 이 패키지의 연결 파일이었던 것과 아직 없는 것만 쓴다.
  const routes: string[] = [];
  for (const file of await walkFiles(destination)) {
    if (file !== "routes.json" && !file.endsWith("/routes.json")) continue;
    let entries: unknown;
    try { entries = JSON.parse(await fs.readFile(path.join(destination, file), "utf8")); }
    catch { continue; }
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (!isRecord(entry) || typeof entry.route !== "string" || !entry.route.startsWith("src/app/") || !isSafeRelativePath(entry.route) ||
          typeof entry.implementation !== "string" || !entry.implementation.startsWith(`${EXTENSIONS_DIRECTORY}/${packageId}/`) || !isSafeRelativePath(entry.implementation) ||
          !Array.isArray(entry.configs) || !entry.configs.every((config) => typeof config === "string" && ROUTE_CONFIG.test(config)) ||
          (entry.exports !== undefined && (!Array.isArray(entry.exports) || !entry.exports.every((item) => typeof item === "string" && ROUTE_EXPORT.test(item))))) continue;
      const target = path.join(root, entry.route);
      const current = await readText(target);
      if (current !== null && !isOwnedAdapter(current, packageId)) continue;
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, renderRouteAdapter(entry as unknown as RouteEntry));
      routes.push(entry.route);
    }
  }

  await writeAdopted(root, { packageId, productUuid: installed.productUuid, version: installed.version, adoptedAt: new Date().toISOString(), requires: installed.requires });
  await writePackageRegistry(root);
  return {
    packageId,
    version: installed.version,
    path: `${EXTENSIONS_DIRECTORY}/${packageId}`,
    routes,
    referencePath: relativeToRoot(root, reference),
    // 가져오기 전에 이미 고친 파일이 있었다면 참고 사본도 원본 그대로가 아니다.
    hadLocalChanges,
  };
}

// 가져온 확장을 포기한다. 폴더를 .plextype/backup으로 옮기고 그 연결 파일을 지워, Store의 패키지를 다시 설치할 수 있게 한다.
export async function discardAdoptedPackage(root: string, packageId: string) {
  assertInstallAllowed();
  const adopted = await readAdopted(root, packageId);
  if (!adopted) throw new InstallerError("내 확장으로 가져온 패키지가 아닙니다.");
  const directory = path.join(root, EXTENSIONS_DIRECTORY, packageId);
  for (const file of await walkFiles(directory)) {
    if (file !== "routes.json" && !file.endsWith("/routes.json")) continue;
    let entries: unknown;
    try { entries = JSON.parse(await fs.readFile(path.join(directory, file), "utf8")); }
    catch { continue; }
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (!isRecord(entry) || typeof entry.route !== "string" || !entry.route.startsWith("src/app/") || !isSafeRelativePath(entry.route)) continue;
      const target = path.join(root, entry.route);
      const current = await readText(target);
      if (current !== null && isAdoptedAdapter(current, packageId)) await fs.rm(target, { force: true });
    }
  }
  const backup = statePath(root, "backup", `${packageId}-${Date.now()}-${randomBytes(4).toString("hex")}`);
  await fs.mkdir(path.dirname(backup), { recursive: true });
  await fs.rename(directory, backup);
  await writePackageRegistry(root);
  return { packageId, version: adopted.version, backupPath: relativeToRoot(root, backup) };
}

// 가져온 패키지의 새 버전을 프로젝트 밖(.plextype/reference)에 받아 둔다. 설치가 아니라 비교용 사본이다.
export async function downloadReferencePackage(root: string, productUuid: string) {
  const { manifest, files } = await loadVerifiedPackage(root, productUuid);
  const directory = referencePath(root, manifest.packageId, manifest.version);
  await fs.rm(directory, { recursive: true, force: true });
  for (const [name, content] of files) {
    const target = path.join(directory, name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  }
  await fs.writeFile(path.join(directory, "plextype.package.json"), JSON.stringify(manifest, null, 2) + "\n");
  const adopted = await readAdopted(root, manifest.packageId);
  return {
    packageId: manifest.packageId,
    version: manifest.version,
    referencePath: relativeToRoot(root, directory),
    // 가져온 시점의 사본이 남아 있으면 두 폴더를 비교해 새 버전에서 바뀐 것을 볼 수 있다.
    basePath: adopted && await hasFile(referencePath(root, manifest.packageId, adopted.version))
      ? relativeToRoot(root, referencePath(root, manifest.packageId, adopted.version)) : null,
  };
}

// 새 버전의 변경을 내 코드에 반영한 뒤, 가져온 확장이 따르는 버전을 올린다. 새 버전 알림과 의존 관계 판단이 이 값을 본다.
export async function markAdoptedVersion(root: string, packageId: string, version: string) {
  assertInstallAllowed();
  const adopted = await readAdopted(root, packageId);
  if (!adopted) throw new InstallerError("내 확장으로 가져온 패키지가 아닙니다.");
  if (!VERSION.test(version)) throw new InstallerError("버전은 1.2.0 형식으로 적어주세요.");
  await writeAdopted(root, { ...adopted, version });
  return { packageId, version };
}
