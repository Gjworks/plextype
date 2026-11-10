// 브라우저 안에서 진행 중인 /api/auth/me 요청을 하나로 묶는다.
// 액세스 토큰이 만료된 상태에서 여러 곳이 동시에 부르면 각 요청이 리프레시 토큰을 회전시키려 하므로, 한 번만 보내고 결과를 나눠 쓴다.
let pending: Promise<any | null> | null = null;

// 서버가 다른 요청의 회전을 기다리다 시간이 다 되면 503(pending)을 준다. 쿠키는 그대로이므로 잠깐 뒤 한 번 더 묻는다.
const PENDING_RETRY_MS = 500;

const requestSession = async (retry = true): Promise<any | null> => {
  const response = await fetch("/api/auth/me", { method: "GET", credentials: "include" });
  const data = await response.json().catch(() => null);
  if (data?.pending && retry) {
    await new Promise((resolve) => setTimeout(resolve, PENDING_RETRY_MS));
    return requestSession(false);
  }
  return data?.isLoggedIn ? data : null;
};

/** 로그인한 사용자 정보를 돌려준다. 로그인하지 않았으면 null. */
export const fetchClientSession = () => {
  if (!pending) {
    pending = requestSession().finally(() => {
      pending = null;
    });
  }
  return pending;
};

/**
 * 세션이 아직 살아 있는지 서버에 묻는다. 화면에서 로그인 여부만 알면 될 때는 useUserContext()의 user를 쓴다.
 * 이 함수는 SSE 재연결처럼 서버 쪽 세션 만료를 다시 확인해야 할 때 쓴다.
 */
export const hasClientSession = async () => {
  try {
    const user = await fetchClientSession();
    return Boolean(user?.id);
  } catch {
    return false;
  }
};
