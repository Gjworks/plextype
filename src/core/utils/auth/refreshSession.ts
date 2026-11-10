import prisma from "@/core/utils/db/prisma";
import redis from "@/core/utils/redis/redis";
import { refresh, refreshVerify, sign, verify } from "./jwtAuth";
import { hashRefreshToken } from "./refreshToken";

// 회전 결과를 옛 토큰 기준으로 잠깐 보관하는 시간(초). 같은 옛 토큰으로 동시에 들어온 요청(여러 탭, 한 페이지의 중복 호출)이 같은 새 토큰을 받는다.
// 이 시간이 지난 옛 토큰은 DB의 해시와 맞지 않아 거절된다. 값이 토큰이므로 짧게 둔다.
const ROTATION_GRACE_SECONDS = 30;
// 한 요청만 회전하도록 잡는 잠금의 최대 유지 시간(초). 회전이 끝나면 바로 푼다.
const LOCK_SECONDS = 10;
// 잠금을 못 잡은 요청이 회전 결과를 기다리는 최대 시간과 확인 간격(ms).
const WAIT_MS = 2000;
const POLL_MS = 100;

const rotatedKey = (hash: string) => `auth:rotated:${hash}`;
const lockKey = (hash: string) => `auth:refresh-lock:${hash}`;

interface RotatedTokens {
  userId: number;
  accessToken: string;
  refreshToken: string;
}

export type RefreshSessionResult =
  | ({ status: "rotated" } & RotatedTokens)
  // 서명 오류, 만료, 세션 버전·비밀번호 불일치, 유예시간이 지난 옛 토큰. 쿠키를 지운다.
  | { status: "invalid" }
  | { status: "inactive" }
  // 다른 요청이 회전 중인데 기다리는 동안 결과가 나오지 않았다. 쿠키를 건드리지 않는다.
  | { status: "pending" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 보관된 결과는 새 액세스 토큰이 아직 유효할 때만 돌려준다. 그 사이 로그아웃·비밀번호 변경·세션 강제 종료가 있었으면 거절된다.
const readRotated = async (hash: string): Promise<RefreshSessionResult | null> => {
  const raw = await redis.get(rotatedKey(hash));
  if (!raw) return null;
  try {
    const cached = JSON.parse(raw) as RotatedTokens;
    const decoded = await verify(cached.accessToken);
    if (!decoded || decoded.id !== cached.userId) return { status: "invalid" };
    return { status: "rotated", ...cached };
  } catch {
    return { status: "invalid" };
  }
};

const rotate = async (refreshToken: string, hash: string, accessTokenExpiresIn?: string, refreshTokenExpiresIn?: string): Promise<RefreshSessionResult> => {
  const decoded = await refreshVerify(refreshToken);
  if (!decoded?.id) return { status: "invalid" };

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { userGroups: { select: { groupId: true } } },
  });
  if (!user || user.refreshToken !== hash) return { status: "invalid" };
  if (!user.isAdmin && user.status && user.status !== "active") return { status: "inactive" };

  const tokenParams = {
    sessionVersion: decoded.sessionVersion,
    credentialVersion: decoded.credentialVersion,
    id: user.id,
    accountId: user.accountId,
    isAdmin: user.isAdmin,
    nickName: user.nickName,
    groups: user.userGroups.map((group) => group.groupId),
  };
  const [accessToken, nextRefreshToken] = await Promise.all([
    sign(tokenParams, accessTokenExpiresIn),
    refresh(tokenParams, refreshTokenExpiresIn),
  ]);

  // 잠금 밖에서 바뀐 경우(로그아웃, 세션 강제 종료, 다른 기기 로그인)는 옛 토큰을 더 쓸 수 없다.
  const rotated = await prisma.user.updateMany({
    where: { id: user.id, refreshToken: hash },
    data: { refreshToken: hashRefreshToken(nextRefreshToken) },
  });
  if (rotated.count !== 1) return { status: "invalid" };

  const tokens: RotatedTokens = { userId: user.id, accessToken, refreshToken: nextRefreshToken };
  await redis.set(rotatedKey(hash), JSON.stringify(tokens), "EX", ROTATION_GRACE_SECONDS);
  return { status: "rotated", ...tokens };
};

/**
 * 리프레시 토큰을 새 액세스·리프레시 토큰으로 바꾼다. 웹(/api/auth/me)과 모바일(/api/auth/refresh)이 같은 규칙을 쓴다.
 * 같은 옛 토큰으로 동시에 들어온 요청은 한 요청만 회전하고, 나머지는 그 결과를 유예시간 동안 그대로 받는다.
 * 쿠키 설정은 호출하는 쪽에서 한다. 토큰 값은 로그에 남기지 않는다.
 */
export async function rotateRefreshSession(
  refreshToken: string,
  { accessTokenExpiresIn, refreshTokenExpiresIn }: { accessTokenExpiresIn?: string; refreshTokenExpiresIn?: string } = {},
): Promise<RefreshSessionResult> {
  const hash = hashRefreshToken(refreshToken);

  const cached = await readRotated(hash);
  if (cached) return cached;

  const locked = await redis.set(lockKey(hash), "1", "EX", LOCK_SECONDS, "NX");
  if (locked === "OK") {
    try {
      // 잠금을 잡기 직전에 다른 요청이 회전을 끝냈을 수 있다.
      return (await readRotated(hash)) ?? (await rotate(refreshToken, hash, accessTokenExpiresIn, refreshTokenExpiresIn));
    } finally {
      await redis.del(lockKey(hash)).catch(() => undefined);
    }
  }

  for (let waited = 0; waited < WAIT_MS; waited += POLL_MS) {
    await sleep(POLL_MS);
    const result = await readRotated(hash);
    if (result) return result;
    // 잠금이 풀렸는데 결과가 없으면 회전이 실패한 것이다. 같은 판정을 받도록 직접 확인한다.
    if (!(await redis.exists(lockKey(hash)))) return rotateRefreshSession(refreshToken, { accessTokenExpiresIn, refreshTokenExpiresIn });
  }
  return { status: "pending" };
}
