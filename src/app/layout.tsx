import "./globals.css";
import "@project/extensions/style.css";
import ReactQueryProvider from "@/core/providers/ReactQueryProvider";
import { UserProvider } from "@/core/providers/UserProvider";
import Log from "@/core/utils/debug/Log";
export const dynamic = 'force-dynamic';
import { ToastContainer } from "@/core/components/toast/toast";
import RealtimeNotificationListener from "@/core/components/toast/RealtimeNotificationListener";

export default function RootLayout({ children }) {
  if (typeof globalThis.Log === "undefined") {
    globalThis.Log = Log;
  }

  return (
    <html
      className="break-keep selection:bg-black selection:text-white dark:selection:bg-primary-400 dark:selection:text-white">
      <body>
        <ReactQueryProvider>
          <UserProvider>
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
