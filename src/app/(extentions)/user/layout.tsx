
import DefaultLayout from "src/layouts/fullLayout/Layout";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";

interface CurrentUser {
  id: number;
  accountId: string;
  isAdmin: boolean;
  groups: number[];
  loggedIn: boolean;
}

export default async function PageLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = await cookieStore.get("accessToken")?.value;

  let currentUser: CurrentUser | null = null;
  if (accessToken) {
    try {
      const decoded = decodeJwt(accessToken) as CurrentUser | null;
      if (decoded) currentUser = { ...decoded, loggedIn: true };
    } catch (err) {
      console.log("JWT decode 실패", err);
    }
  }

  return (
    <DefaultLayout>
        {children}
    </DefaultLayout>
  );
}