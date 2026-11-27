"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requireAdmin } from "@/core/utils/auth/requireAdmin";
import { encryptSecret, secretEncryptionReady } from "@/core/utils/crypto/secret";
import { upsertSettingsQuery, type SettingSeed } from "@/core/utils/settings/settings.query";
import { getLoggedUserAction } from "@/modules/user/actions/user.action";

import { activeConfig, readSecrets, readStoredSettings, secretSettingKey, settingKey, SETTINGS_GROUP } from "@/modules/user/social/config";
import { originFromHeaders } from "@/modules/user/social/flow";
import { SOCIAL_LOGIN_LINKS_PATH } from "@/modules/user/social/paths";
import { findProvider, PROVIDERS } from "@/modules/user/social/registry";
import { callbackUrl, isComplete, requiredFields } from "@/modules/user/social/providers";
import type { SocialLoginLink, SocialLoginSettingsView } from "./social.type";
import * as query from "./social.query";

// 한 칸에 받는 가장 긴 값은 키 파일의 내용이다. 그보다 넉넉히 잡되 잘못 붙여 넣은 긴 글은 걸러 낸다.
const MAX_VALUE_LENGTH = 8192;

// 관리자 화면: 제공자별 설정과 연결된 계정 수. 비밀 값은 돌려주지 않는다.
export async function getSocialLoginSettingsAdminAction(): Promise<SocialLoginSettingsView> {
  await requireAdmin();
  const [stored, counts, requestHeaders] = await Promise.all([readStoredSettings(), query.countLinksByProvider(), headers()]);
  const origin = originFromHeaders(requestHeaders, process.env.NEXT_PUBLIC_DEFAULT_URL || "http://localhost:3000");
  return {
    encryptionReady: secretEncryptionReady(),
    providers: PROVIDERS.map((provider) => {
      const settings = stored.get(provider.key);
      const secrets = settings ? readSecrets(settings) : {};
      return {
        key: provider.key,
        label: provider.label,
        brand: provider.brand,
        logo: provider.logo ?? null,
        enabled: Boolean(settings?.enabled),
        active: Boolean(activeConfig(provider, settings)),
        linkedCount: counts.get(provider.key) ?? 0,
        callbackUrl: callbackUrl(origin, provider),
        guide: provider.guide,
        fields: provider.fields.map((field) => ({
          name: field.name,
          label: field.label,
          secret: Boolean(field.secret),
          required: field.required !== false,
          multiline: Boolean(field.multiline),
          placeholder: field.placeholder ?? "",
          value: field.secret ? "" : settings?.values[field.name] ?? "",
          configured: Boolean(field.secret && secrets[field.name]),
        })),
      };
    }),
  };
}

// 관리자 화면: 제공자 하나의 설정을 저장한다. 비밀 칸을 비워 두면 저장된 값을 그대로 둔다.
export async function saveSocialLoginProviderAdminAction(form: FormData): Promise<{ success: boolean; message: string }> {
  try { await requireAdmin(); }
  catch { return { success: false, message: "관리자 권한이 필요합니다." }; }

  const provider = findProvider(String(form.get("provider") ?? ""));
  if (!provider) return { success: false, message: "지원하지 않는 로그인 수단입니다." };
  const enabled = form.get("enabled") === "on";
  const input = (name: string) => String(form.get(`field.${name}`) ?? "").trim();
  if (provider.fields.some((field) => input(field.name).length > MAX_VALUE_LENGTH)) {
    return { success: false, message: "입력한 값이 너무 깁니다. 다시 확인해주세요." };
  }

  try {
    const previous = (await readStoredSettings()).get(provider.key);
    const values = Object.fromEntries(provider.fields.filter((field) => !field.secret).map((field) => [field.name, input(field.name)]).filter(([, value]) => value));
    // 비밀이 아닌 값(클라이언트 ID 등)이 바뀌면 예전 비밀 값은 다른 앱의 것이므로 이어 쓰지 않는다.
    const sameApp = Boolean(previous) && JSON.stringify(values) === JSON.stringify(previous!.values);
    const secrets: Record<string, string> = sameApp ? readSecrets(previous!) : {};
    let secretsChanged = !sameApp;
    for (const field of provider.fields.filter((item) => item.secret)) {
      if (!input(field.name)) continue;
      secrets[field.name] = input(field.name);
      secretsChanged = true;
    }

    if (enabled && !isComplete(provider, { ...values, ...secrets })) {
      const missing = requiredFields(provider).filter((field) => !(values[field.name] || secrets[field.name])).map((field) => field.label);
      return { success: false, message: `${provider.label} 로그인을 켜려면 ${missing.join(", ")} 값을 입력해야 합니다.` };
    }
    const hasSecrets = Object.keys(secrets).length > 0;
    if (secretsChanged && hasSecrets && !secretEncryptionReady()) {
      return { success: false, message: "비밀 값을 저장하려면 서버에 32자 이상의 SECRET_KEY가 필요합니다." };
    }

    const seeds: SettingSeed[] = [{
      key: settingKey(provider.key), value: JSON.stringify({ enabled, values }), group: SETTINGS_GROUP, label: `${provider.label} 로그인`, isPublic: false,
    }];
    if (secretsChanged) {
      seeds.push({
        key: secretSettingKey(provider.key), value: hasSecrets ? encryptSecret(JSON.stringify(secrets)) : "",
        group: SETTINGS_GROUP, label: `${provider.label} 로그인 비밀 값`, isPublic: false,
      });
    }
    await upsertSettingsQuery(seeds);
    revalidatePath("/admin/user/social-login");
    return { success: true, message: enabled ? `${provider.label} 로그인을 켰습니다. 로그인 화면에 버튼이 나옵니다.` : `${provider.label} 설정을 저장했습니다.` };
  } catch (error) {
    console.error("Social Login Settings Error:", error);
    return { success: false, message: "설정을 저장하지 못했습니다." };
  }
}

// 회원 화면: 로그인한 회원이 연결했거나 새로 연결할 수 있는 제공자. 로그인하지 않았으면 null.
export async function getMySocialLinksAction(): Promise<SocialLoginLink[] | null> {
  const user = await getLoggedUserAction();
  if (!user.id) return null;
  const [rows, stored] = await Promise.all([query.findLinksByUserId(user.id), readStoredSettings()]);
  const links = new Map(rows.map((link) => [link.provider, link]));
  return PROVIDERS.map((provider) => {
    const link = links.get(provider.key);
    return {
      key: provider.key,
      label: provider.label,
      brand: provider.brand,
      logo: provider.logo ?? null,
      available: Boolean(activeConfig(provider, stored.get(provider.key))),
      linked: Boolean(link),
      email: link?.email ?? null,
      linkedAt: link?.createdAt.toISOString() ?? null,
      canUnlink: Boolean(link) && !link!.createdAccount,
    };
  // 꺼져 있고 연결한 적도 없는 제공자는 회원에게 보여 줄 것이 없다.
  }).filter((link) => link.available || link.linked);
}

// 회원 화면의 해제 버튼(form action). 소셜 로그인으로 만든 계정의 연결은 지우지 않는다.
export async function unlinkSocialAccountAction(formData: FormData): Promise<void> {
  const provider = findProvider(String(formData.get("provider") ?? ""));
  const user = await getLoggedUserAction();
  if (!user.id || !provider) return;
  const link = await query.findLinkByUserProvider(user.id, provider.key);
  if (!link || link.createdAccount) return;
  await query.deleteLinkById(link.id);
  revalidatePath(SOCIAL_LOGIN_LINKS_PATH);
}
