import { importJWK, SignJWT } from "jose";

export const getWebPushSubject = () => {
  return process.env.WEB_PUSH_VAPID_SUBJECT || "mailto:admin@example.com";
};

const base64UrlToBytes = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64");
};

const bytesToBase64Url = (bytes: Buffer) => {
  return bytes.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const isPlaceholderValue = (value: string | undefined, keyName: string) => {
  const trimmed = value?.trim();
  return !trimmed || trimmed === keyName || trimmed === `\${${keyName}}`;
};

const buildVapidJwk = () => {
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();

  if (
    isPlaceholderValue(publicKey, "WEB_PUSH_VAPID_PUBLIC_KEY") ||
    isPlaceholderValue(privateKey, "WEB_PUSH_VAPID_PRIVATE_KEY")
  ) return null;

  if (!publicKey || !privateKey) return null;

  const publicBytes = base64UrlToBytes(publicKey);
  const privateBytes = base64UrlToBytes(privateKey);

  if (publicBytes.length !== 65 || publicBytes[0] !== 4 || privateBytes.length !== 32) {
    throw new Error("INVALID_VAPID_KEYS");
  }

  return {
    kty: "EC",
    crv: "P-256",
    x: bytesToBase64Url(publicBytes.subarray(1, 33)),
    y: bytesToBase64Url(publicBytes.subarray(33, 65)),
    d: bytesToBase64Url(privateBytes),
  };
};

export const getWebPushPublicKey = () => {
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
  if (isPlaceholderValue(publicKey, "WEB_PUSH_VAPID_PUBLIC_KEY")) return "";
  return publicKey?.trim() || "";
};

export const isWebPushConfigured = () => {
  return !isPlaceholderValue(process.env.WEB_PUSH_VAPID_PUBLIC_KEY, "WEB_PUSH_VAPID_PUBLIC_KEY") &&
    !isPlaceholderValue(process.env.WEB_PUSH_VAPID_PRIVATE_KEY, "WEB_PUSH_VAPID_PRIVATE_KEY");
};

export const createVapidHeaders = async (endpoint: string) => {
  const publicKey = getWebPushPublicKey();
  const jwk = buildVapidJwk();

  if (!publicKey || !jwk) return null;

  const audience = new URL(endpoint).origin;
  const key = await importJWK(jwk, "ES256");
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", typ: "JWT" })
    .setAudience(audience)
    .setExpirationTime("12h")
    .setSubject(getWebPushSubject())
    .sign(key);

  return {
    Authorization: `vapid t=${token}, k=${publicKey}`,
    "Crypto-Key": `p256ecdsa=${publicKey}`,
    TTL: "120",
  };
};
