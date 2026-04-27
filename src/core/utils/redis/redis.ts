import Redis from 'ioredis';

// 싱글톤 패턴으로 연결 관리 (메모리 낭비 방지)
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis', // 도커 서비스 이름
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redisClient.on('error', (err) => console.error('❌ Redis Error:', err));

export default redisClient;