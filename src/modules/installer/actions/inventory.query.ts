import fs from "node:fs/promises";
import path from "node:path";
import type { InstalledPackage, InstallerInventory } from "./_type";

const packageIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export function parseInstalledManifest(value: unknown, directory: string): InstalledPackage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (!packageIdPattern.test(directory) || item.schemaVersion !== 1 || item.type !== "plextype-extension" ||
      item.packageId !== directory || item.installPath !== `src/extensions/${directory}` ||
      typeof item.version !== "string" || !versionPattern.test(item.version) ||
      typeof item.productUuid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(item.productUuid) ||
      typeof item.minPlatformVersion !== "string" || !versionPattern.test(item.minPlatformVersion) ||
      (item.maxPlatformVersion !== null && (typeof item.maxPlatformVersion !== "string" || !versionPattern.test(item.maxPlatformVersion))) ||
      typeof item.requiresDatabaseReview !== "boolean") return null;

  return {
    packageId: directory,
    version: item.version,
    productUuid: item.productUuid,
    installPath: `src/extensions/${directory}`,
    minPlatformVersion: item.minPlatformVersion,
    maxPlatformVersion: item.maxPlatformVersion as string | null,
    requiresDatabaseReview: item.requiresDatabaseReview,
    verification: "unverified",
  };
}

// Inventory is read-only; a manifest is not evidence of signature or file integrity.
export async function readInstallerInventory(root = process.cwd()): Promise<InstallerInventory> {
  const result: InstallerInventory = { packages: [], warnings: [] };
  const directory = path.join(root, "src/extensions");
  try {
    const stat = await fs.lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Invalid extension directory");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return result;
    throw error;
  }
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || !packageIdPattern.test(entry.name)) continue;
    const file = path.join(directory, entry.name, "plextype.package.json");
    try {
      const stat = await fs.lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024) {
        result.warnings.push(`${entry.name}: 패키지 정보 파일을 읽을 수 없습니다.`);
        continue;
      }
      const item = parseInstalledManifest(JSON.parse(await fs.readFile(file, "utf8")), entry.name);
      if (item) result.packages.push(item);
      else result.warnings.push(`${entry.name}: 패키지 정보 형식을 확인해 주세요.`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        result.warnings.push(`${entry.name}: 패키지 정보를 읽지 못했습니다.`);
      }
    }
  }
  return result;
}
