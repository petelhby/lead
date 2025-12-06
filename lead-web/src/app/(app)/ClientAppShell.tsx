// src/app/(app)/ClientAppShell.tsx
"use client";

// ВАЖНО: проверь путь к твоему Topbar.
// Если твой файл лежит иначе (например "@/components/layout/Topbar"),
// ПРИСМОТРИСЬ К ИМПОРТУ НИЖЕ и поправь только его строку.
import Topbar from "@/components/Topbar";

import AppContainer from "@/components/AppContainer";

/**
 * Клиентская оболочка приватной зоны:
 *  - Topbar (шапка проекта)
 *  - Контейнер контента нужной ширины
 */
export default function ClientAppShell({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* Шапка */}
            <header className="sticky top-0 z-50">
                {/* Если в самом Topbar нет собственного фона/границы — можно раскомментировать обёртку ниже */}
                {/* <div className="bg-white/80 backdrop-blur border-b"> */}
                <Topbar />
                {/* </div> */}
            </header>

            {/* Контент в контейнере, как на референсе */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6">
                {/* Если у тебя AppContainer сам рисует паддинги/ширину — оставь его.
            Если нет — можно убрать AppContainer и оставить только <div className="..."> */}
                <AppContainer>
                    {children}
                </AppContainer>
            </main>
        </>
    );
}
