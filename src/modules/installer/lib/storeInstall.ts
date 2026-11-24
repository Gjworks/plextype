// Store에 연결해 확장 패키지를 내려받고, 검증한 뒤 src/extensions에 설치하는 로직.
//
// 관리자 화면(서버 액션)과 명령 줄(scripts/plextype.mjs)이 함께 쓴다. 명령 줄에서는 Node가 이 파일을 직접 읽으므로
// - Node 내장 모듈만 import하고(경로 별칭 `@/`와 다른 소스 파일 import 금지),
// - 지워지기만 하면 되는 타입 문법만 쓴다(enum, namespace, 생성자 매개변수 속성 금지).
//
// 설치는 소스 코드를 프로젝트에 넣는 일이라 개발 환경에서만 한다. 운영 서버에는 저장소에 커밋된 결과가 배포로 들어간다.
// Store 구현(src/extensions/store)을 참조하지 않고 Store의 HTTP API만 쓴다.

import { createHash, randomBytes, verify } from "node:crypto";
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
  requiresDatabaseReview: boolean;
};

// 사용자에게 그대로 보여 줘도 되는 실패 사유. 그 밖의 예외는 내부 경로 등이 섞일 수 있어 화면에 내보내지 않는다.
export class InstallerError extends Error {}

export const DEFAULT_STORE_URL = "https://gjworks.dev";
// 연결 정보(토큰 포함)와 임시·백업 폴더를 두는 곳. 저장소에 올리지 않는다(.gitignore).
export const STATE_DIRECTORY = ".plextype";
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
      manifest.installPath !== `src/extensions/${manifest.packageId}` ||
      typeof manifest.version !== "string" || !VERSION.test(manifest.version) ||
      typeof manifest.minPlatformVersion !== "string" || !VERSION.test(manifest.minPlatformVersion) ||
      (manifest.maxPlatformVersion !== null && (typeof manifest.maxPlatformVersion !== "string" || !VERSION.test(manifest.maxPlatformVersion))) ||
      typeof manifest.requiresDatabaseReview !== "boolean" ||
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
    const owner = path.posix.join("src/extensions", packageId, path.posix.dirname(name)).replace(/\/\.$/, "");
    for (const entry of entries) {
      if (!isRecord(entry) || typeof entry.route !== "string" || typeof entry.implementation !== "string" ||
          !entry.route.startsWith("src/app/") || !/\/(page|layout|route|loading|error|not-found|template|default)\.tsx?$/.test(entry.route) ||
          !isSafeRelativePath(entry.route) ||
          !entry.implementation.startsWith(owner + "/") || !isSafeRelativePath(entry.implementation) ||
          !files.has(entry.implementation.slice(`src/extensions/${packageId}/`.length)) ||
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
  const directory = path.join(root, "src", "extensions", packageId);
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
  return { directory, productUuid: manifest.productUuid, version: manifest.version, routes };
}

// 연결 파일이 이 패키지의 것인지 본다: 설치기가 만든 형식이고 이 패키지 폴더의 구현을 가리켜야 한다.
const isOwnedAdapter = (content: string, packageId: string) => (
  ADAPTER_HEADERS.some((header) => content.startsWith(header)) && content.includes(`from "@/extensions/${packageId}/`)
);

async function assertRealDirectory(directory: string, label: string) {
  try {
    const stat = await fs.lstat(directory);
    if (stat.isDirectory() && !stat.isSymbolicLink()) return;
  } catch { /* 아래에서 알린다. */ }
  throw new InstallerError(`${label} 폴더를 찾지 못했습니다. Plextype 프로젝트 루트에서 실행해주세요.`);
}

export async function installStorePackage(root: string, productUuid: string, options: { versionUuid?: string } = {}): Promise<InstallResult> {
  assertInstallAllowed();
  if (!UUID.test(productUuid) || (options.versionUuid && !UUID.test(options.versionUuid))) throw new InstallerError("설치할 자료를 찾지 못했습니다.");
  const connection = await readConnection(root);
  if (!connection) throw new InstallerError("먼저 Store에 연결해주세요.");
  await assertRealDirectory(path.join(root, "src", "extensions"), "src/extensions");
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

  const target = path.join(root, "src", "extensions", manifest.packageId);
  const installed = await readInstalled(root, manifest.packageId);
  let targetExists = true;
  try { await fs.lstat(target); } catch { targetExists = false; }
  if (targetExists && (!installed || installed.productUuid !== productUuid)) {
    throw new InstallerError(`src/extensions/${manifest.packageId} 폴더가 이미 있고 이 자료로 설치한 것이 아닙니다. 덮어쓰지 않습니다.`);
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
    if (error instanceof InstallerError) throw error;
    throw new InstallerError("파일을 쓰는 중 오류가 나서 설치 전 상태로 되돌렸습니다. 폴더 권한을 확인해주세요.");
  }

  return {
    packageId: manifest.packageId,
    version: manifest.version,
    previousVersion: installed?.version ?? null,
    installPath: manifest.installPath,
    routes: routes.map((entry) => entry.route),
    requiresDatabaseReview: manifest.requiresDatabaseReview,
  };
}

// 쉬운설치로 넣은 패키지를 뺀다. 폴더는 지우지 않고 `.plextype/backup`으로 옮겨, 잘못 뺐을 때 되돌릴 수 있게 한다.
export async function uninstallStorePackage(root: string, packageId: string) {
  assertInstallAllowed();
  if (!PACKAGE_ID.test(packageId)) throw new InstallerError("설치된 패키지를 찾지 못했습니다.");
  const installed = await readInstalled(root, packageId);
  if (!installed) throw new InstallerError("쉬운 설치로 넣은 패키지가 아니어서 제거하지 않습니다.");
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
  return { packageId, version: installed.version, routes: removedRoutes, backupPath: path.relative(root, backup).split(path.sep).join("/") };
}
