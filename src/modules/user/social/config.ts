import { decryptSecret } from "@/core/utils/crypto/secret";
import { getSettingsByKeysQuery } from "@/core/utils/settings/settings.query";

import { isComplete, type ProviderConfig, type ProviderDefinition } from "./providers";
import { PROVIDERS } from "./registry";

// 제공자 설정은 관리자 화면에서 입력받아 설정 테이블(AppSetting)에 둔다. 제공자가 늘어도 테이블을 고치지 않는다.
// 사용 여부와 공개해도 되는 값은 JSON 한 줄로, 비밀 값은 JSON으로 묶어 암호화한 뒤 다른 키에 따로 둔다.
export const SETTINGS_GROUP = "social-login";
export const settingKey = (providerKey: string) => `social-login.${providerKey}`;
export const secretSettingKey = (providerKey: string) => `social-login.${providerKey}.secret`;

export type StoredProviderSettings = {
  enabled: boolean;
  // 비밀이 아닌 입력 값(name → 값).
  values: Record<string, string>;
  // 암호화된 비밀 값 묶음. 없으면 빈 문자열.
  encryptedSecrets: string;
};

const stringRecord = (value: unknown): Record<string, string> => (
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== ""))
    : {}
);

export async function readStoredSettings(): Promise<Map<string, StoredProviderSettings>> {
  const records = new Map((await getSettingsByKeysQuery(PROVIDERS.flatMap((provider) => [settingKey(provider.key), secretSettingKey(provider.key)])))
    .map((record) => [record.key, record.value ?? ""]));
  return new Map(PROVIDERS.map((provider) => {
    let stored: { enabled?: unknown; values?: unknown } = {};
    try { stored = JSON.parse(records.get(settingKey(provider.key)) || "{}"); }
    catch { /* 읽을 수 없는 값은 설정하지 않은 것으로 본다. */ }
    return [provider.key, {
      enabled: stored.enabled === true,
      values: stringRecord(stored.values),
      encryptedSecrets: records.get(secretSettingKey(provider.key)) || "",
    }];
  }));
}

// SECRET_KEY가 바뀌면 풀 수 없다. 비밀 값이 없는 것으로 보고, 관리자 화면에서 다시 입력하게 한다.
export function readSecrets(stored: StoredProviderSettings): Record<string, string> {
  if (!stored.encryptedSecrets) return {};
  try { return stringRecord(JSON.parse(decryptSecret(stored.encryptedSecrets))); }
  catch { return {}; }
}

// 켜져 있고 필수 값이 갖춰진 제공자의 설정. 그렇지 않으면 null이며, 버튼도 라우트도 열리지 않는다.
export function activeConfig(provider: ProviderDefinition, stored: StoredProviderSettings | undefined): ProviderConfig | null {
  if (!stored?.enabled) return null;
  const config = { ...stored.values, ...readSecrets(stored) };
  return isComplete(provider, config) ? config : null;
}

export async function getProviderConfig(provider: ProviderDefinition) {
  return activeConfig(provider, (await readStoredSettings()).get(provider.key));
}

export async function getActiveProviders(): Promise<ProviderDefinition[]> {
  const stored = await readStoredSettings();
  return PROVIDERS.filter((provider) => activeConfig(provider, stored.get(provider.key)));
}
