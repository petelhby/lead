// src/app/layout.tsx
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
        {/* Шапка проекта */}
        <Topbar />
        {/* Контент в контейнере: на / — без рамок, на остальных — max-w-7xl */}
        <AppContainer>{children}</AppContainer>
      </body>
    </html>
  );
}

export const metadata = {
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};
