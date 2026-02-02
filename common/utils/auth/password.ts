import bcrypt from "bcrypt";

/**
 * 🔐 비밀번호 해싱 (저장용)
 * AES와 달리 SECRET_KEY가 필요 없으며, 결과에 Salt가 포함됩니다.
 */
export async function hashedPassword(password: string): Promise<string> {
  try {
    // 숫자가 높을수록 보안은 강해지지만 계산 속도가 느려집니다. (보통 10 권장)
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    console.log("🔐 Hashed Password created.");
    return hash;
  } catch (error) {
    console.error("Hashing Error:", error);
    throw new Error("Hashing failed");
  }
}

/**
 * 🔓 비밀번호 검증 (입력값과 DB 해시값 비교)
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // bcrypt.compare가 내부적으로 Salt를 추출하여 비교해줍니다.
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

    console.log("🔓 Password verification result:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("Verification Error:", error);
    return false;
  }
}