import { z } from "zod";

export const mailSettingsSchema = z.object({
  mode: z.enum(["environment", "custom", "disabled"]),
  host: z.string().trim().max(253),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().trim().max(254),
  from: z.string().trim().max(254),
}).superRefine((value, ctx) => {
  if (value.mode !== "custom") return;
  if (!/^[a-zA-Z0-9.-]+$/.test(value.host)) ctx.addIssue({ code: "custom", path: ["host"], message: "SMTP 서버 주소를 입력해주세요." });
  if (!z.string().email().safeParse(value.from).success) ctx.addIssue({ code: "custom", path: ["from"], message: "올바른 발신 이메일을 입력해주세요." });
  if (!value.user || /[\r\n]/.test(value.user)) ctx.addIssue({ code: "custom", path: ["user"], message: "SMTP 인증 계정을 입력해주세요." });
  if ((value.port === 465 && !value.secure) || (value.port === 587 && value.secure)) ctx.addIssue({ code: "custom", path: ["secure"], message: "465 포트는 TLS, 587 포트는 STARTTLS를 선택해주세요." });
});

export type MailSettings = z.infer<typeof mailSettingsSchema>;
export type MailSettingsView = MailSettings & { passwordConfigured: boolean; encryptionReady: boolean; environmentConfigured: boolean };
export const defaultMailSettings: MailSettings = { mode: "environment", host: "", port: 465, secure: true, user: "", from: "" };
