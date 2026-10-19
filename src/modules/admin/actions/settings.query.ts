import prisma from "@utils/db/prisma";

export type PublicSitemapEntry = {
  url: string;
  updatedAt: Date | null;
};

export const getPublicPageSitemapEntriesQuery = async () => {
  return prisma.$queryRaw<PublicSitemapEntry[]>`
    SELECT
      CASE
        WHEN "href" = '/' THEN '/'
        ELSE "href"
      END AS "url",
      "updatedAt"
    FROM "SiteNavigation"
    WHERE "isActive" = true
      AND "visibility" = 'public'
      AND "href" IS NOT NULL
      AND "href" <> ''
      AND "href" NOT LIKE 'http%'
      AND "href" NOT LIKE '#%'
    ORDER BY "order" ASC, "id" ASC
  `;
};

export const getPublicPostSitemapEntriesQuery = async () => {
  return prisma.$queryRaw<PublicSitemapEntry[]>`
    SELECT
      CONCAT('/posts/', m."mid", '/', d."slug") AS "url",
      d."updatedAt"
    FROM "Document" d
    INNER JOIN "Modules" m ON m."id" = d."moduleId"
    WHERE d."moduleType" = 'posts'
      AND COALESCE(d."isSecrets", false) = false
      AND (d."published" = true OR d."published" IS NULL)
      AND d."slug" IS NOT NULL
      AND m."mid" IS NOT NULL
    ORDER BY d."updatedAt" DESC
    LIMIT 1000
  `;
};
