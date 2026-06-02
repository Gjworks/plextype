import "./globals.css";
import "@project/extensions/style.css";
import ReactQueryProvider from "@/core/providers/ReactQueryProvider";
import { UserProvider } from "@/core/providers/UserProvider";
import Log from "@/core/utils/debug/Log";
export const dynamic = 'force-dynamic';
import { ToastContainer } from "@/core/components/toast/toast";
import RealtimeNotificationListener from "@/core/components/toast/RealtimeNotificationListener";
import { getSeoMetadata } from "@/core/utils/helper/matadata";
import UserPreferenceBootstrap from "@/core/providers/UserPreferenceBootstrap";
import { cookies } from "next/headers";

export async function generateMetadata() {
  return getSeoMetadata({});
}

const themeInitScript = `
(function () {
  try {
    var storageKey = "userThemePreference";
    var cookieMatch = document.cookie.match(/(?:^|; )userThemePreference=([^;]*)/);
    var cookieTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : "";
    var theme = cookieTheme || localStorage.getItem(storageKey) || "system";
    if (theme !== "light" && theme !== "dark" && theme !== "system") {
      theme = "system";
    }

    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);
    var root = document.documentElement;

    root.classList.toggle("dark", shouldUseDark);
    root.dataset.theme = theme;
    root.style.colorScheme = shouldUseDark ? "dark" : "light";
    localStorage.setItem(storageKey, theme);
  } catch (error) {
    document.documentElement.dataset.theme = "system";
  }
})();
`;

const resolveThemePreference = (value?: string): "system" | "light" | "dark" => {
  if (value === "light" || value === "dark") return value;
  return "system";
};

export default async function RootLayout({ children }) {
  if (typeof globalThis.Log === "undefined") {
    globalThis.Log = Log;
  }

  const cookieStore = await cookies();
  const themePreference = resolveThemePreference(cookieStore.get("userThemePreference")?.value);

  return (
    <html
      suppressHydrationWarning
      data-theme={themePreference}
      className={`${themePreference === "dark" ? "dark " : ""}break-keep selection:bg-black selection:text-white dark:selection:bg-primary-400 dark:selection:text-white`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ReactQueryProvider>
          <UserProvider>
            <UserPreferenceBootstrap />
            <RealtimeNotificationListener />

            {children}

            <ToastContainer position="top-right" />
            <div id="left"></div>
            <div id="right"></div>
            <div id="bottom"></div>
            <div id="modal"></div>
          </UserProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
