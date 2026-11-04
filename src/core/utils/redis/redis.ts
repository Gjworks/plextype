import Redis from 'ioredis';

const isNextBuild = process.env.NEXT_PHASE === "phase-production-build";

// 재연결을 포기(null 반환)하면 연결이 영구히 닫혀 Redis가 다시 살아나도 복구되지 않는다.
// 끊긴 동안의 명령은 maxRetriesPerRequest로 빠르게 실패시키고, 연결은 최대 5초 간격으로 계속 재시도한다.
const retryStrategy = (times: number) => Math.min(times * 200, 5000);

const createRedisClient = () => {
  if (isNextBuild) {
    return {
      get: async () => null,
      set: async () => "OK",
      incr: async () => 1,
      exists: async () => 0,
      expire: async () => 0,
      ttl: async () => -2,
      keys: async () => [],
      mget: async (...keys: string[]) => keys.map(() => null),
      del: async () => 0,
      on: () => undefined,
    } as unknown as Redis;
  }

  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy,
    });
  }

  return new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy,
  });
};

// 싱글톤 패턴으로 연결 관리 (메모리 낭비 방지)
const redisClient = createRedisClient();

redisClient.on('error', (err) => {
  if (isNextBuild) return;
  console.error('❌ Redis Error:', err);
});

export default redisClient;
