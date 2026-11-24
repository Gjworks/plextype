"use server";

import { revalidatePath } from "next/cache";

import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { readInstallerInventory } from "./inventory.query";
import {
  DEFAULT_STORE_URL,
  InstallerError,
  connectStore,
  disconnectStore,
  fetchCatalog,
  adoptStorePackage,
  discardAdoptedPackage,
  downloadReferencePackage,
  installStorePackage,
  listAdoptedPackages,
  markAdoptedVersion,
  previewStorePackage,
  readConnection,
  readPlatformVersion,
  refreshStoreKeys,
  uninstallStorePackage,
} from "../lib/storeInstall";
import { applyPackageDatabase, describeDatabaseFailure, syncPackageSchema } from "../lib/applyDatabase";
import type { InstallerActionResult, InstallerCatalogItem, InstallerPreviewResult, InstallerState } from "./_type";

const isAdmin = async () => {
  const session = await getUserSessionAction();
  return Boolean(session.success && session.data?.isAdmin);
};

const readField = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

// 설치기가 알려 주려고 만든 사유만 화면에 내보낸다. 그 밖의 예외에는 서버 경로 등이 섞일 수 있다.
const run = async (work: () => Promise<string>): Promise<InstallerActionResult> => {
  if (!(await isAdmin())) return { success: false, message: "관리자 권한이 필요합니다." };
  try {
    const message = await work();
    revalidatePath("/admin/installer", "layout");
    return { success: true, message };
  } catch (error) {
    if (error instanceof InstallerError) return { success: false, message: error.message };
    console.error("[installer]", error);
    return { success: false, message: "처리 중 오류가 발생했습니다. 서버 로그를 확인해주세요." };
  }
};

export async function getInstallerOverviewAdminAction(): Promise<InstallerState> {
  if (!(await isAdmin())) return { success: false, message: "관리자 권한이 필요합니다." };
  try {
    const root = process.cwd();
    const [inventory, connection, platformVersion, adopted] = await Promise.all([
      readInstallerInventory(),
      readConnection(root),
      readPlatformVersion(root).catch(() => ""),
      listAdoptedPackages(root),
    ]);
    let catalog: InstallerCatalogItem[] = [];
    let catalogError: string | null = null;
    try {
      catalog = await fetchCatalog(connection?.storeUrl || DEFAULT_STORE_URL);
    } catch (error) {
      catalogError = error instanceof InstallerError ? error.message : "Store 자료 목록을 받지 못했습니다.";
    }
    return {
      success: true,
      message: "패키지 정보를 확인했습니다.",
      data: {
        ...inventory,
        environment: process.env.NODE_ENV === "development" ? "development" : "production",
        platformVersion,
        storeConnected: Boolean(connection),
        adopted: adopted.map(({ packageId, productUuid, version, adoptedAt }) => ({ packageId, productUuid, version, adoptedAt, path: `src/extensions/${packageId}` })),
        connection: connection ? {
          storeUrl: connection.storeUrl,
          accountName: connection.accountName,
          tokenName: connection.tokenName,
          keyCount: connection.keys.length,
          connectedAt: connection.connectedAt,
        } : null,
        defaultStoreUrl: DEFAULT_STORE_URL,
        catalog,
        catalogError,
      },
    };
  } catch {
    return { success: false, message: "설치된 패키지를 읽지 못했습니다. 서버의 확장 폴더 접근 권한을 확인해 주세요." };
  }
}

export async function connectStoreAdminAction(formData: FormData): Promise<InstallerActionResult> {
  return run(async () => {
    const connection = await connectStore(process.cwd(), readField(formData, "storeUrl"), readField(formData, "token"));
    return `${connection.storeUrl}에 연결했습니다.`;
  });
}

export async function disconnectStoreAdminAction(): Promise<InstallerActionResult> {
  return run(async () => {
    await disconnectStore(process.cwd());
    return "Store 연결을 해제했습니다.";
  });
}

export async function refreshStoreKeysAdminAction(): Promise<InstallerActionResult> {
  return run(async () => {
    const connection = await refreshStoreKeys(process.cwd());
    return `서명 검증 키 ${connection.keys.length}개를 다시 받았습니다.`;
  });
}

// 설치하기 전에 이 패키지가 DB에 무엇을 하는지 화면에 보여 주기 위한 조회. 아무것도 바꾸지 않는다.
export async function previewStorePackageAdminAction(productUuid: string): Promise<InstallerPreviewResult> {
  if (!(await isAdmin())) return { success: false, message: "관리자 권한이 필요합니다." };
  try {
    return { success: true, message: "", preview: await previewStorePackage(process.cwd(), productUuid) };
  } catch (error) {
    if (error instanceof InstallerError) return { success: false, message: error.message };
    console.error("[installer]", error);
    return { success: false, message: "처리 중 오류가 발생했습니다. 서버 로그를 확인해주세요." };
  }
}

// applyDatabase가 true면 설치에 이어 패키지의 스키마를 합치고 마이그레이션을 개발 DB에 적용한다.
// 화면은 적용될 SQL을 보여 주고 확인을 받은 뒤에만 true로 부른다.
// expected는 화면이 미리 본 패키지별 버전이다. 그 사이 Store의 버전이 바뀌었으면 설치하지 않는다.
export async function installStorePackageAdminAction(
  productUuid: string,
  options: { versionUuid?: string; expected?: Record<string, string>; applyDatabase?: boolean; overwriteLocalChanges?: boolean } = {},
): Promise<InstallerActionResult> {
  return run(async () => {
    const root = process.cwd();
    const result = await installStorePackage(root, productUuid, { versionUuid: options.versionUuid, expected: options.expected, overwriteLocalChanges: options.overwriteLocalChanges });
    const notes = [
      result.previousVersion ? `${result.packageId}을(를) ${result.previousVersion}에서 ${result.version}으로 업데이트했습니다.` : `${result.packageId} ${result.version}을(를) 설치했습니다.`,
      result.alsoInstalled.length ? `함께 설치: ${result.alsoInstalled.map((item) => `${item.packageId} ${item.version}`).join(", ")}.` : "",
      result.registered ? "관리자 메뉴와 스킨을 등록했습니다." : "",
    ];
    if (!result.requiresDatabaseReview) return notes.filter(Boolean).join(" ");
    if (!options.applyDatabase) {
      return [...notes, "DB 변경 파일이 들어 있습니다. 터미널에서 npm run plextype -- migrate 를 실행해 반영해주세요."].filter(Boolean).join(" ");
    }

    const database = await applyPackageDatabase(root);
    if (database.applied) {
      return [
        ...notes,
        result.newMigrations.length ? `마이그레이션 ${result.newMigrations.length}개를 DB에 적용했습니다.` : "스키마를 합쳤습니다.",
        "패키지가 새 Prisma 모델을 쓴다면 개발 서버를 다시 시작해야 동작합니다.",
      ].filter(Boolean).join(" ");
    }
    // 스키마를 합치는 단계에서 막혔다면 DB는 아직 그대로다. 새로 설치한 패키지는 빼서 프로젝트를 설치 전으로 되돌린다.
    // 업데이트였거나 마이그레이션이 일부 적용된 뒤라면 되돌리는 쪽이 더 어긋나므로 그대로 두고 알린다.
    if (database.failedStep === "generate" && !result.previousVersion) {
      // 이 패키지를 필요로 하는 쪽부터 뺀다: 대상 패키지, 그다음 함께 새로 설치한 패키지를 설치의 역순으로.
      await uninstallStorePackage(root, result.packageId);
      for (const item of [...result.alsoInstalled].reverse()) {
        if (!item.previousVersion) await uninstallStorePackage(root, item.packageId).catch(() => {});
      }
      await syncPackageSchema(root);
      throw new InstallerError(`${describeDatabaseFailure(database).message}\n\n설치를 취소하고 패키지를 뺐습니다.`);
    }
    throw new InstallerError(`${describeDatabaseFailure(database).message}\n\n패키지 파일은 설치된 상태입니다. 원인을 고친 뒤 npm run plextype -- migrate 로 다시 적용하거나, 설치된 패키지에서 제거해주세요.`);
  });
}

export async function uninstallStorePackageAdminAction(packageId: string): Promise<InstallerActionResult> {
  return run(async () => {
    const root = process.cwd();
    const result = await uninstallStorePackage(root, packageId);
    const notes = [`${result.packageId}을(를) 제거했습니다. 폴더는 ${result.backupPath}에 보관했습니다.`];
    if (result.migrations.length) {
      await syncPackageSchema(root);
      notes.push("이 패키지가 만든 테이블과 마이그레이션 적용 이력은 DB에 남아 있습니다. 필요 없으면 테이블을 직접 정리해주세요.");
    }
    return notes.join(" ");
  });
}

// 설치한 패키지를 src/extensions로 옮겨 직접 고쳐 쓰는 내 확장으로 만든다.
export async function adoptStorePackageAdminAction(packageId: string): Promise<InstallerActionResult> {
  return run(async () => {
    const result = await adoptStorePackage(process.cwd(), packageId);
    return [
      `${result.packageId}을(를) ${result.path}로 가져왔습니다. 이제 직접 고쳐 쓸 수 있고, 새 버전은 알림만 받습니다.`,
      `가져온 시점의 사본은 ${result.referencePath}에 있습니다.`,
      result.hadLocalChanges ? "가져오기 전에 이미 고친 파일이 있어, 이 사본은 Store의 원본과 다릅니다." : "",
    ].filter(Boolean).join(" ");
  });
}

// 가져온 확장을 포기하고 Store의 패키지를 다시 설치할 수 있는 상태로 돌린다. 폴더는 백업으로 옮긴다.
export async function discardAdoptedPackageAdminAction(packageId: string): Promise<InstallerActionResult> {
  return run(async () => {
    const result = await discardAdoptedPackage(process.cwd(), packageId);
    return `${result.packageId} 가져오기를 취소했습니다. 고쳐 쓰던 폴더는 ${result.backupPath}에 보관했습니다. Store 자료에서 다시 설치할 수 있습니다.`;
  });
}

// 가져온 패키지의 새 버전을 비교용으로 받아 둔다. 프로젝트의 소스는 바꾸지 않는다.
export async function downloadReferenceAdminAction(productUuid: string): Promise<InstallerActionResult> {
  return run(async () => {
    const result = await downloadReferencePackage(process.cwd(), productUuid);
    return [
      `${result.packageId} ${result.version}을(를) ${result.referencePath}에 받았습니다.`,
      result.basePath ? `바뀐 내용 보기: git diff --no-index ${result.basePath} ${result.referencePath}` : "",
      "변경을 내 확장에 반영한 뒤 기준 버전을 올려주세요.",
    ].filter(Boolean).join("\n");
  });
}

export async function markAdoptedVersionAdminAction(packageId: string, version: string): Promise<InstallerActionResult> {
  return run(async () => {
    const result = await markAdoptedVersion(process.cwd(), packageId, version);
    return `${result.packageId}의 기준 버전을 ${result.version}으로 올렸습니다.`;
  });
}
