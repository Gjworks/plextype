import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'src/core/prisma/migrations',
    seed: 'dotenv -e .env -e .env.development -- node src/core/prisma/seed.js',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
