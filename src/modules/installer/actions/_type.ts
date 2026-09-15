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

export type InstallerState = {
  success: boolean;
  message: string;
  data?: InstallerInventory & {
    environment: "development" | "production";
    storeConnected: false;
  };
};
