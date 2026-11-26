import "server-only";
import { createHash } from "node:crypto";
import redis from "@/core/utils/redis/redis";

// Atomic increment + expiry prevents parallel requests or worker crashes bypassing limits.
const SCRIPT = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('TTL', KEYS[1])
if ttl < 0 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`;
export async function consumeRateLimit(scope: string, subject: string, limit: number, windowSeconds: number) {
  const digest = createHash("sha256").update(subject.trim().toLowerCase()).digest("hex");
  const result = await redis.eval(SCRIPT, 1, `security:rate:${scope}:${digest}`, windowSeconds) as [number, number];
  if (!Array.isArray(result) || result.length !== 2) throw new Error("Rate limit unavailable");
  return { allowed: Number(result[0]) <= limit, retryAfter: Math.max(1, Number(result[1])) };
}
// 계정 찾기 요청 제한. 15분 동안 요청자(IP)당 30회, 대상 이메일당 3회까지 허용한다.
// 요청자 한도는 요청자별로 따로 센다. 모두가 함께 쓰는 한도는 한 사람이 채우면 다른 사용자의 계정 찾기까지 막는다.
// IP는 전달 헤더에서 오므로 프록시가 덮어쓰지 않는 환경에서는 위조할 수 있다. 한 주소로 나가는 메일 수는 이메일 한도가 막는다.
export async function allowRecoveryRequest(email: string, clientIp: string) {
  const requester = await consumeRateLimit("recovery-ip", clientIp, 30, 900);
  if (!requester.allowed) return false;
  return (await consumeRateLimit("recovery-email", email, 3, 900)).allowed;
}
