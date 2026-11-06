import Redis from 'ioredis';

const isNextBuild = process.env.NEXT_PHASE === "phase-production-build";

// 재연결을 포기(null 반환)하면 연결이 영구히 닫혀 Redis가 다시 살아나도 복구되지 않는다.
// 끊긴 동안의 명령은 maxRetriesPerRequest로 빠르게 실패시키고, 연결은 최대 5초 간격으로 계속 재시도한다.
const retryStrategy = (times: number) => Math.min(times * 200, 5000);

// 한 서버의 여러 사이트가 같은 Redis를 쓰므로 모든 키 앞에 사이트 이름을 붙여 서로의 캐시·세션 버전·로그인 잠금을 덮어쓰지 않게 한다.
// REDIS_KEY_PREFIX가 없으면 사이트마다 다르게 정하는 APP_NAME을 쓴다. 두 사이트의 이름이 같으면 키도 다시 겹친다.
// 이 값을 바꾸면 기존 키를 못 찾으므로 세션 버전이 사라져 모든 사용자가 다시 로그인해야 한다.
const keyPrefix = `${(process.env.REDIS_KEY_PREFIX || process.env.APP_NAME || "plextype").trim().replace(/[^a-zA-Z0-9_-]/g, "_")}:`;

// keyPrefix는 키 인자에만 붙고 KEYS의 패턴에는 붙지 않으며, 결과에는 접두사가 붙은 채로 돌아온다.
// 패턴에 접두사를 붙이고 결과에서 떼어, 호출하는 쪽은 접두사 없이 받은 키를 그대로 get·mget·del에 넘길 수 있게 한다.
const scopeKeysCommand = (client: Redis) => {
  const rawKeys = client.keys.bind(client) as (pattern: string) => Promise<string[]>;
  client.keys = (async (pattern: string) => {
    const keys = await rawKeys(`${keyPrefix}${pattern}`);
    return keys.map((key) => key.slice(keyPrefix.length));
  }) as Redis["keys"];
  return client;
};

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
    return scopeKeysCommand(new Redis(process.env.REDIS_URL, {
      keyPrefix,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy,
    }));
  }

  return scopeKeysCommand(new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    keyPrefix,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy,
  }));
};

// 싱글톤 패턴으로 연결 관리 (메모리 낭비 방지)
const redisClient = createRedisClient();

redisClient.on('error', (err) => {
  if (isNextBuild) return;
  console.error('❌ Redis Error:', err);
});

export default redisClient;
