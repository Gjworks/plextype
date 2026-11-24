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
};

export type InstallerState = {
  success: boolean;
  message: string;
  data?: InstallerInventory & {
    environment: "development" | "production";
    platformVersion: string;
    storeConnected: boolean;
    // 토큰은 화면으로 내보내지 않는다.
    connection: { storeUrl: string; accountName: string; tokenName: string; keyCount: number; connectedAt: string } | null;
    defaultStoreUrl: string;
    catalog: InstallerCatalogItem[];
    // 목록을 받지 못한 이유. 연결과 무관하게 설치된 패키지 화면은 보여 준다.
    catalogError: string | null;
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
  hasDatabaseFiles: boolean;
  migrations: { packageId: string; name: string; sql: string; truncated: boolean }[];
};

export type InstallerPreviewResult = InstallerActionResult & { preview?: InstallerPackagePreview };
