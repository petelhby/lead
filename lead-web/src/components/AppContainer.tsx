// src/components/AppContainer.tsx
"use client";
import { usePathname } from "next/navigation";

export default function AppContainer({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLogin = pathname === "/" || pathname.startsWith("/auth");
    return (
        <main className={isLogin ? "" : "p-4 max-w-7xl mx-auto"}>
            {children}
        </main>
    );
}
