import "/styles/globals.css";
import "/styles/style.css";
import ReduxProviders from "@plextype/redux/Providers";
import ReactQueryProvider from "@plextype/providers/ReactQueryProvider";
import Log from "@plextype/utils/debug/Log";

export default function RootLayout({ children }) {
  if (typeof globalThis.Log === "undefined") {
    globalThis.Log = Log;
  }

  return (
    <html className="break-keep selection:bg-black selection:text-white dark:selection:bg-primary-400 dark:selection:text-white">
      <body>
        <ReactQueryProvider>
          <ReduxProviders>{children}</ReduxProviders>
          <div id="toast"></div>
          <div id="left"></div>
          <div id="right"></div>
          <div id="bottom"></div>
          <div id="modal"></div>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
