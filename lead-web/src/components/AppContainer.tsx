"use client";
import { usePathname } from "next/navigation";

export default function AppContainer({ children }: { children: React.ReactNode }) {
    const isLogin = usePathname() === "/";
    return (
        <main className={isLogin ? "" : "p-4 max-w-7xl mx-auto"}>
            {children}
        </main>
    );
}
