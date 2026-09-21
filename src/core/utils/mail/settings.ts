import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getSettingsByKeysQuery } from "@/modules/admin/actions/settings.query";
import { defaultMailSettings, mailSettingsSchema } from "@/modules/admin/mail-settings";

export const MAIL_SETTINGS_KEY = "mail.smtp";
export const MAIL_PASSWORD_KEY = "mail.smtp.password";
export function mailEncryptionReady() {
  return (process.env.MAIL_ENCRYPTION_KEY || process.env.SECRET_KEY || "").length >= 32;
}
function encryptionKey() {
  if (!mailEncryptionReady()) throw new Error("메일 인증정보 암호화 키가 필요합니다.");
  return createHash("sha256").update(process.env.MAIL_ENCRYPTION_KEY || process.env.SECRET_KEY!).digest();
}
export function encryptMailPassword(password: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}
export function decryptMailPassword(value: string) {
  const [version, iv, tag, data] = value.split(":");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("메일 인증정보를 확인해주세요.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
export async function readMailSettings() {
  const records = await getSettingsByKeysQuery([MAIL_SETTINGS_KEY, MAIL_PASSWORD_KEY]);
  const config = records.find(record => record.key === MAIL_SETTINGS_KEY)?.value;
  return {
    settings: config ? mailSettingsSchema.parse(JSON.parse(config)) : { ...defaultMailSettings },
    encryptedPassword: records.find(record => record.key === MAIL_PASSWORD_KEY)?.value || "",
  };
}
export function environmentSmtpConfig() {
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const from = process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.SMTP_USER || process.env.MAIL_USER;
  if (!host || !from) return null;
  const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
  return {
    host, from, port,
    secure: (process.env.SMTP_SECURE || process.env.MAIL_SECURE) === "true" || port === 465,
    user: process.env.SMTP_USER || process.env.MAIL_USER,
    password: process.env.SMTP_PASSWORD || process.env.MAIL_PASSWORD,
  };
}
export async function getSmtpConfig() {
  const { settings, encryptedPassword } = await readMailSettings();
  if (settings.mode === "disabled") return null;
  if (settings.mode === "environment") return environmentSmtpConfig();
  if (!encryptedPassword) throw new Error("SMTP 인증정보가 설정되지 않았습니다.");
  return { ...settings, password: decryptMailPassword(encryptedPassword) };
}
