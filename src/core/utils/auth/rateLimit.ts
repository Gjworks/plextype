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
// Untrusted forwarded IP headers are deliberately not used as security identities.
export async function allowRecoveryRequest(email: string) {
  const global = await consumeRateLimit("recovery-global", "all", 30, 900);
  if (!global.allowed) return false;
  return (await consumeRateLimit("recovery-email", email, 3, 900)).allowed;
}
