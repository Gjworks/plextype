import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    // scripts/sync-prisma.mjs가 src/core/prisma/migrations와 src/extensions/**/prisma/migrations를 합쳐 만드는 폴더다.
    // migrate deploy 전에 npm run prisma:sync를 실행해야 한다. 새 마이그레이션은 npm run migrate:dev -- --to <대상>으로 만든다.
    path: 'prisma/migrations',
    seed: 'dotenv -e .env -e .env.development -- node src/core/prisma/seed.js',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
