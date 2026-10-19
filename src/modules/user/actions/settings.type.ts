import { z } from "zod";

const expiresInRule = z
  .string()
  .trim()
  .regex(/^\d+[smhd]$/, "시간 형식은 15m, 1h, 7d처럼 입력해주세요.");

export const AuthSettingsSchema = z.object({
  registrationEnabled: z.boolean(),
  accountDeletionEnabled: z.boolean(),
  defaultUserStatus: z.enum(["active", "pending", "blocked"], {
    error: "가입 후 상태를 선택해주세요.",
  }),
  minPasswordLength: z.coerce
    .number()
    .int()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다.")
    .max(128, "비밀번호 최소 길이가 너무 큽니다."),
  requirePasswordNumber: z.boolean(),
  requirePasswordLetter: z.boolean(),
  requirePasswordSpecial: z.boolean(),
  loginFailLimit: z.coerce
    .number()
    .int()
    .min(1, "실패 허용 횟수는 1 이상이어야 합니다.")
    .max(30, "실패 허용 횟수가 너무 큽니다."),
  loginFailWindowMinutes: z.coerce
    .number()
    .int()
    .min(1, "실패 카운트 유지 시간은 1분 이상이어야 합니다.")
    .max(1440, "실패 카운트 유지 시간이 너무 깁니다."),
  loginLockMinutes: z.coerce
    .number()
    .int()
    .min(1, "잠금 시간은 1분 이상이어야 합니다.")
    .max(1440, "잠금 시간이 너무 깁니다."),
  accessTokenExpiresIn: expiresInRule,
  refreshTokenExpiresIn: expiresInRule,
  allowConcurrentSessions: z.boolean(),
  adminSessionGuard: z.boolean(),
});

export type AuthSettingsParams = z.infer<typeof AuthSettingsSchema>;

export type AuthSettingsData = AuthSettingsParams;
