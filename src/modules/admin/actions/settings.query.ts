import prisma, { Prisma } from "@utils/db/prisma";

export type SettingSeed = {
  key: string;
  value: string;
  group: string;
  label: string;
  description?: string;
  isPublic?: boolean;
};

type SettingRecord = {
  key: string;
  value: string | null;
};

export const getSettingsByKeysQuery = async (keys: string[]) => {
  if (keys.length === 0) return [];

  return prisma.$queryRaw<SettingRecord[]>`
    SELECT "key", "value"
    FROM "AppSetting"
    WHERE "key" IN (${Prisma.join(keys)})
  `;
};

export const upsertSettingsQuery = async (settings: SettingSeed[]) => {
  if (settings.length === 0) return [];

  return prisma.$transaction(
    settings.map((setting) =>
      prisma.$executeRaw`
        INSERT INTO "AppSetting" (
          "key",
          "value",
          "group",
          "label",
          "description",
          "isPublic",
          "updatedAt"
        )
        VALUES (
          ${setting.key},
          ${setting.value},
          ${setting.group},
          ${setting.label},
          ${setting.description || null},
          ${setting.isPublic ?? false},
          NOW()
        )
        ON CONFLICT ("key")
        DO UPDATE SET
          "value" = EXCLUDED."value",
          "group" = EXCLUDED."group",
          "label" = EXCLUDED."label",
          "description" = EXCLUDED."description",
          "isPublic" = EXCLUDED."isPublic",
          "updatedAt" = NOW()
      `,
    ),
  );
};
