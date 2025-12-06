// src/app/(app)/projects/page.tsx
import dynamic from "next/dynamic";

// Весь UI вынесен в клиентский компонент, SSR отключён → нет конфликтов гидрации
const ClientProjectsPage = dynamic(() => import("./ClientProjectsPage"), { ssr: false });

export default function Page() {
  // suppressHydrationWarning — чтобы React не сравнивал серверную «пустышку» и клиентский UI
  return (
    <div suppressHydrationWarning>
      <ClientProjectsPage />
    </div>
  );
}
