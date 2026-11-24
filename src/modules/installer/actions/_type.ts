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
