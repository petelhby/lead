import "./globals.css";
import Topbar from "@/components/Topbar";
import AppContainer from "@/components/AppContainer";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={roboto.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Topbar />
        <AppContainer>{children}</AppContainer>
      </body>
    </html>
  );
}
export const metadata = {
  // …твои остальные поля
  icons: {
    icon: '/logo.png',      // обычный фавикон
    shortcut: '/logo.png',  // <link rel="shortcut icon">
    apple: '/logo.png',     // для iOS
  },
};