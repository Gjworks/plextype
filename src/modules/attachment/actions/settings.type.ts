import { z } from "zod";

export const UploadSettingsSchema = z.object({
  maxUploadSizeMb: z.coerce
    .number()
    .int()
    .min(1, "파일당 용량은 1MB 이상이어야 합니다.")
    .max(500, "파일당 용량은 500MB 이하로 입력해주세요."),
  userStorageLimitMb: z.coerce
    .number()
    .int()
    .min(1, "사용자별 용량은 1MB 이상이어야 합니다.")
    .max(102400, "사용자별 용량이 너무 큽니다."),
  maxImageWidth: z.coerce
    .number()
    .int()
    .min(320, "이미지 최대 너비는 320px 이상이어야 합니다.")
    .max(10000, "이미지 최대 너비가 너무 큽니다."),
  maxImageHeight: z.coerce
    .number()
    .int()
    .min(320, "이미지 최대 높이는 320px 이상이어야 합니다.")
    .max(10000, "이미지 최대 높이가 너무 큽니다."),
  imageQuality: z.coerce
    .number()
    .int()
    .min(1, "이미지 품질은 1 이상이어야 합니다.")
    .max(100, "이미지 품질은 100 이하로 입력해주세요."),
  imageOutputFormat: z.enum(["original", "webp", "jpeg", "png", "avif"], {
    error: "이미지 출력 포맷을 선택해주세요.",
  }),
  allowedExtensions: z
    .string()
    .trim()
    .min(1, "허용 확장자를 입력해주세요.")
    .max(500, "허용 확장자 목록이 너무 깁니다."),
  enableImageProcessing: z.boolean(),
  stripImageMetadata: z.boolean(),
  verifyMimeType: z.boolean(),
  restrictProfileImage: z.boolean(),
  allowVideo: z.boolean(),
  allowArchive: z.boolean(),
});

export type UploadSettingsParams = z.infer<typeof UploadSettingsSchema>;

export type UploadSettingsData = UploadSettingsParams;
