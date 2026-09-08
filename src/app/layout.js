import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./Providers";
import { getServerSession } from "next-auth";
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

export default async function RootLayout({ children }) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>
        <AntdRegistry>
          <ThemeProvider>
            <AuthProvider session={session}>
              <ReduxProvider>
                <main>{children}</main>
              </ReduxProvider>
            </AuthProvider>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
