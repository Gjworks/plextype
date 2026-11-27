export type InstalledPackage = {
  packageId: string;
  version: string;
  productUuid: string;
  installPath: string;
  minPlatformVersion: string;
  maxPlatformVersion: string | null;
  requiresDatabaseReview: boolean;
  verification: "unverified";
};

export type InstallerInventory = {
  packages: InstalledPackage[];
  warnings: string[];
};

export type InstallerCatalogItem = {
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
  // 보안 패치로 표시된 공개 버전들.
  securityVersions: string[];
};

// Store에서 받은 뒤 src/extensions로 옮겨 직접 고쳐 쓰는 패키지.
export type InstallerAdoptedPackage = { packageId: string; productUuid: string; version: string; path: string; adoptedAt: string };

// Store의 코어 배포본으로 코어를 올릴 수 있는지.
export type InstallerCoreStatus = {
  // 코어의 원본 저장소인지. 원본은 배포본을 만드는 쪽이라 받지 않는다.
  source: boolean;
  // Store에 있는 가장 새 코어 버전. 배포본이 없거나 목록을 받지 못했으면 null.
  latestVersion: string | null;
  updateAvailable: boolean;
  error: string | null;
};

export type InstallerState = {
  success: boolean;
  message: string;
  data?: InstallerInventory & {
    environment: "development" | "production";
    platformVersion: string;
    storeConnected: boolean;
    adopted: InstallerAdoptedPackage[];
    // 토큰은 화면으로 내보내지 않는다.
    connection: { storeUrl: string; accountName: string; tokenName: string; keyCount: number; connectedAt: string } | null;
    defaultStoreUrl: string;
    catalog: InstallerCatalogItem[];
    // 목록을 받지 못한 이유. 연결과 무관하게 설치된 패키지 화면은 보여 준다.
    catalogError: string | null;
    core: InstallerCoreStatus;
  };
};

export type InstallerActionResult = { success: boolean; message: string };

export type InstallerPackagePreview = {
  productUuid: string;
  versionUuid: string;
  packageId: string;
  version: string;
  previousVersion: string | null;
  // 설치를 막는 사유. 하나라도 있으면 설치할 수 없다.
  blockers: string[];
  node: { required: string | null; current: string };
  alsoInstalls: { packageId: string; version: string; previousVersion: string | null; versionUuid: string }[];
  npm: { missing: { name: string; range: string }[]; conflicts: { name: string; range: string; installed: string }[]; command: string | null };
  localChanges: { packageId: string; files: { path: string; change: "modified" | "removed" | "added" }[] }[];
  hasDatabaseFiles: boolean;
  migrations: { packageId: string; name: string; sql: string; truncated: boolean }[];
};

export type InstallerPreviewResult = InstallerActionResult & { preview?: InstallerPackagePreview };

export type InstallerCoreConflictKind = "modified" | "deleted" | "removed" | "occupied";

export type InstallerCorePreview = {
  currentVersion: string;
  version: string;
  sha256: string;
  size: number;
  hasBaseline: boolean;
  // 적용을 막는 사유. 하나라도 있으면 적용할 수 없다.
  blockers: string[];
  writes: { path: string; change: "added" | "changed" }[];
  removes: string[];
  conflicts: { path: string; kind: InstallerCoreConflictKind }[];
  kept: string[];
  dependencies: string[];
  migrations: string[];
  // 적용하면 프로젝트 루트의 AGENTS.md가 어떻게 되는지. 공통 규칙 파일이 없는 배포본이면 null.
  agents: "created" | "updated" | "unchanged" | "manual" | "skipped" | null;
};

export type InstallerCorePreviewResult = InstallerActionResult & { preview?: InstallerCorePreview };
