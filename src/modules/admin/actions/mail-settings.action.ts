"use server";

import { revalidatePath } from "next/cache";
import { getUserSessionAction } from "@/modules/user/actions/user.action";
import { upsertSettingsQuery } from "./settings.query";
import { mailSettingsSchema, type MailSettingsView } from "../mail-settings";
import { encryptMailPassword, environmentSmtpConfig, mailEncryptionReady, MAIL_PASSWORD_KEY, MAIL_SETTINGS_KEY, readMailSettings } from "@/core/utils/mail/settings";

export async function getMailSettingsAdminAction(): Promise<{ success: boolean; message: string; data?: MailSettingsView }> {
  const session = await getUserSessionAction();
  if (!session?.data?.isAdmin) return { success: false, message: "관리자 권한이 필요합니다." };
  try {
    const { settings, encryptedPassword } = await readMailSettings();
    return { success: true, message: "", data: { ...settings, passwordConfigured: Boolean(encryptedPassword), encryptionReady: mailEncryptionReady(), environmentConfigured: Boolean(environmentSmtpConfig()) } };
  } catch {
    return { success: false, message: "메일 설정을 불러오지 못했습니다." };
  }
}

export async function updateMailSettingsAdminAction(form: FormData) {
  const session = await getUserSessionAction();
  if (!session?.data?.isAdmin) return { success: false, message: "관리자 권한이 필요합니다." };
  try {
  const previous = await readMailSettings();
  const parsed = mailSettingsSchema.safeParse({
    ...(form.get("mode") === "custom" ? {
      host: form.get("host") ?? "", port: form.get("port") ?? 465,
      secure: form.get("secure") === "true", user: form.get("user") ?? "", from: form.get("from") ?? "",
    } : previous.settings),
    mode: form.get("mode"),
  });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message };
  const password = form.get("password") ?? "";
  if (typeof password !== "string" || password.length > 4096) return { success: false, message: "SMTP 비밀번호를 확인해주세요." };
    const settings = parsed.data;
    const identityChanged = settings.host !== previous.settings.host || settings.user !== previous.settings.user;
    if (settings.mode === "custom" && (!previous.encryptedPassword || identityChanged) && !password) {
      return { success: false, message: "SMTP 서버 또는 계정을 변경하면 비밀번호도 입력해야 합니다." };
    }
    if (settings.mode === "custom" && !mailEncryptionReady()) {
      return { success: false, message: "서버에 32자 이상의 MAIL_ENCRYPTION_KEY 또는 SECRET_KEY가 필요합니다." };
    }
    const seeds = [{ key: MAIL_SETTINGS_KEY, value: JSON.stringify(settings), group: "mail", label: "메일 설정", isPublic: false }];
    if (settings.mode === "custom" && password) seeds.push({ key: MAIL_PASSWORD_KEY, value: encryptMailPassword(password), group: "mail", label: "SMTP 인증정보", isPublic: false });
    else if (identityChanged) seeds.push({ key: MAIL_PASSWORD_KEY, value: "", group: "mail", label: "SMTP 인증정보", isPublic: false });
    await upsertSettingsQuery(seeds);
    revalidatePath("/admin/settings/mail");
    return { success: true, message: "메일 설정을 저장했습니다." };
  } catch {
    return { success: false, message: "메일 설정을 저장하지 못했습니다." };
  }
}
