import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./Providers";
import { getServerSession } from "next-auth";
import { ToastContainer } from "react-toastify";
import ReduxProvider from "@/lib/ReduxProvider";
import AllDataProvider from "@/components/Providers/AllDataProvider";



const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gastify 💸",
  description: "Take control of your incomes and bills",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider session={session}>
          <ReduxProvider>
            <AllDataProvider>
            <main>{children}</main>

            </AllDataProvider>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </ReduxProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
