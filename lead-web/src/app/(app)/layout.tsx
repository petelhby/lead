// src/app/(app)/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Серверная защита приватной зоны: без токена отправляем на /auth
  const token = cookies().get("token")?.value;
  if (!token) {
    redirect("/auth");
  }

  // Никакой дополнительной разметки: RootLayout сам рисует Topbar и контейнер
  return <>{children}</>;
}
