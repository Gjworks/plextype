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
  readConnection,
  readPlatformVersion,
  refreshStoreKeys,
  uninstallStorePackage,
} from "../lib/storeInstall";
import type { InstallerActionResult, InstallerCatalogItem, InstallerState } from "./_type";

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

export async function installStorePackageAdminAction(productUuid: string): Promise<InstallerActionResult> {
  return run(async () => {
    const result = await installStorePackage(process.cwd(), productUuid);
    const notes = [
      result.previousVersion ? `${result.packageId}을(를) ${result.previousVersion}에서 ${result.version}으로 업데이트했습니다.` : `${result.packageId} ${result.version}을(를) 설치했습니다.`,
      result.requiresDatabaseReview ? "DB 변경 파일이 들어 있으니 검토한 뒤 직접 반영해주세요." : "",
    ];
    return notes.filter(Boolean).join(" ");
  });
}

export async function uninstallStorePackageAdminAction(packageId: string): Promise<InstallerActionResult> {
  return run(async () => {
    const result = await uninstallStorePackage(process.cwd(), packageId);
    return `${result.packageId}을(를) 제거했습니다. 폴더는 ${result.backupPath}에 보관했습니다.`;
  });
}
