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
  installStorePackage,
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
    const [inventory, connection, platformVersion] = await Promise.all([
      readInstallerInventory(),
      readConnection(root),
      readPlatformVersion(root).catch(() => ""),
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
export async function installStorePackageAdminAction(productUuid: string, options: { versionUuid?: string; applyDatabase?: boolean } = {}): Promise<InstallerActionResult> {
  return run(async () => {
    const root = process.cwd();
    const result = await installStorePackage(root, productUuid, { versionUuid: options.versionUuid });
    const notes = [
      result.previousVersion ? `${result.packageId}을(를) ${result.previousVersion}에서 ${result.version}으로 업데이트했습니다.` : `${result.packageId} ${result.version}을(를) 설치했습니다.`,
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
      await uninstallStorePackage(root, result.packageId);
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
