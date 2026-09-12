import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/lib/ReduxProvider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import ThemeProvider from "./ThemeProvider";
// import AllDataProvider from "@/components/Providers/AllDataProvider";



const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gastify 💸",
  description: "Take control of your incomes and bills",
};

// Runs before React hydrates, so the light theme (when previously chosen)
// paints on first frame instead of flashing dark-then-light. Dark needs no
// entry here since it's already the plain :root default in globals.css.
const themeInitScript = `(function(){try{if(localStorage.getItem("gf-theme")==="light"){document.documentElement.setAttribute("data-theme","light");}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Shaves the DNS/TLS handshake off the Google sign-in redirect -
            the browser opens the connection to Google's own domain ahead
            of time instead of only starting it the instant "Google" is
            clicked. Doesn't touch the actual OAuth round trip itself (that
            page navigation, and the human on the other end of it, is real,
            unavoidable latency no client-side change can remove), just the
            part before it. */}
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>
        <AntdRegistry>
          <ThemeProvider>
            <ReduxProvider>
              <main>{children}</main>
            </ReduxProvider>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
