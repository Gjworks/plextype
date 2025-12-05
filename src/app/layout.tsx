import "./globals.css";
import "./style.css";
import ReduxProviders from "@plextype/redux/Providers";
import ReactQueryProvider from "@plextype/providers/ReactQueryProvider";
import {UserProvider} from "@plextype/providers/UserProvider";
import Log from "@plextype/utils/debug/Log";

export default function RootLayout({children}) {
  if (typeof globalThis.Log === "undefined") {
    globalThis.Log = Log;
  }

  return (
    <html
      className="break-keep selection:bg-black selection:text-white dark:selection:bg-primary-400 dark:selection:text-white">
    <body>
    <ReactQueryProvider>
      <UserProvider>
        <ReduxProviders>{children}</ReduxProviders>
        <div id="toast"></div>
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
