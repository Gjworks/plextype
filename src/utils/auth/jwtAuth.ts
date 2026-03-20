import { SignJWT, jwtVerify, decodeJwt } from "jose";
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

interface TokenPayload {
  id: number;
  accountId: string;
  isAdmin: boolean | null;
  exp: number;
}

// access Token 발급
const sign = async (payload: object) => {
  const accessToken_expiresIn = process.env.ACCESSTOKEN_EXPIRES_IN;
  if (!accessToken_expiresIn)
    throw new Error("ACCESSTOKEN_EXPIRES_IN is not defined");
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(accessToken_expiresIn)
    .sign(secret);
};

// access Token 검증
const verify = async (token: string): Promise<TokenPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, Buffer.from(secret));
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
};

// refresh Token 발급
const refresh = async (payload: object) => {
  const refreshToken_expiresIn = process.env.REFRESHTOKEN_EXPIRES_IN;
  if (!refreshToken_expiresIn)
    throw new Error("REFRESHTOKEN_EXPIRES_IN is not defined");
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(refreshToken_expiresIn)
    .sign(secret);
};

const refreshVerify = async (
  token: string,
): Promise<{ id: number; accountId: string; isAdmin: boolean } | null> => {
  try {
    const refresh = await jwtVerify(token, Buffer.from(secret));
    return refresh.payload as {
      id: number;
      accountId: string;
      isAdmin: boolean;
      groups: number[];
    };
  } catch (error) {
    return null;
  }
};

export { sign, verify, refresh, refreshVerify };
