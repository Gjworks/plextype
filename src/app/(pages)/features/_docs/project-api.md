---
title: Project API
description: 코어 업데이트를 유지하면서 proxy, Prisma, 배포판 동기화를 프로젝트별로 확장하는 방법입니다.
---

## Proxy 확장

`src/proxy.ts`는 Next.js가 찾는 고정 파일이라 삭제하거나 gitignore 처리하지 않습니다. 대신 내부 구현은 `@project/proxy` alias로 위임합니다.

```ts
// src/extensions/proxy.ts
import type { NextRequest } from "next/server";
import { proxy as defaultProxy } from "@/core/proxy/defaultProxy";

export async function proxy(request: NextRequest) {
  return defaultProxy(request);
}
```

기본 proxy에는 관리자 접근 제어, 로그인 사용자 접근 제어, Redis active session 확인, CSRF origin 검증이 포함되어 있습니다.

## Prisma 확장

DB 모델을 추가할 때 코어 `prisma/schema.prisma`를 직접 수정하지 않습니다. extension schema fragment를 만들고 `npm run prisma:sync`로 루트 스키마를 생성합니다.

```prisma
// src/extensions/prisma/schema/issue.prisma
model IssueMeta {
  id         Int      @id @default(autoincrement())
  documentId Int
  priority   String?
  createdAt  DateTime @default(now())

  @@index([documentId])
}
```

코어 모델과 관계를 맺고 싶을 때는 우선 scalar 컬럼을 사용하세요. 예를 들어 `documentId Int`, `userId Int`를 두고 query에서 조합하면 코어 모델에 back relation을 추가하지 않아도 됩니다.

## Prisma 명령

```bash
npm run prisma:sync
npm run prisma:generate
npm run migrate:dev
npm run dbpush:push
```

`prisma:sync`는 schema 파일만 생성합니다. DB에 실제 테이블을 만들려면 `npm run migrate:dev`를 실행해야 합니다.

## Extension seed

프로젝트별 초기 데이터가 필요하면 `src/extensions/prisma/seed.js`를 추가합니다. 이 파일은 기본 seed 트랜잭션 안에서 실행됩니다.

```js
module.exports = async ({ client }) => {
  await client.query(`
    INSERT INTO "IssueMeta" ("documentId", "priority", "createdAt")
    VALUES ($1, $2, NOW())
    ON CONFLICT DO NOTHING
  `, [1, "normal"]);
};
```

extension seed는 반드시 idempotent하게 작성해야 합니다.
