import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// 관리자 화면에서 입력받은 외부 서비스 키(OAuth 시크릿, API 키 등)를 DB에 저장할 때 쓰는 암호화.
// DB만 유출되어도 키가 드러나지 않게 하는 것이 목적이다. 서버의 SECRET_KEY로 암호화하므로 SECRET_KEY가 바뀌면 다시 입력해야 한다.
// SECRET_KEY는 설치 스크립트(setup.mjs)가 만들어 .env에 넣는다.

// 짧은 키는 추측될 수 있어 받지 않는다.
const MIN_KEY_LENGTH = 32;
// 저장 형식이 바뀌면 이 값을 올려 예전 값을 구분한다.
const VERSION = "v1";

export function secretEncryptionReady() {
  return (process.env.SECRET_KEY || "").length >= MIN_KEY_LENGTH;
}

function encryptionKey() {
  if (!secretEncryptionReady()) throw new Error(`서버에 ${MIN_KEY_LENGTH}자 이상의 SECRET_KEY가 필요합니다.`);
  return createHash("sha256").update(process.env.SECRET_KEY!).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

// 형식이 다르거나 SECRET_KEY가 바뀌어 풀 수 없으면 던진다.
export function decryptSecret(value: string) {
  const [version, iv, tag, data] = value.split(":");
  if (version !== VERSION || !iv || !tag || !data) throw new Error("저장된 비밀 값의 형식이 올바르지 않습니다.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
