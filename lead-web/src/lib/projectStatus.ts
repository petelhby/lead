// src/lib/projectStatus.ts
export type ProjectStatus = "IN_PROGRESS" | "PAUSED" | "CLOSED" | "PAID";

// Жёстко задаём ключи, чтобы избежать undefined/порядка Object.keys
export const PROJECT_STATUS_KEYS = [
    "IN_PROGRESS",
    "PAUSED",
    "CLOSED",
    "PAID",
] as const;

export const PROJECT_STATUS_MAP: Record<ProjectStatus, string> = {
    IN_PROGRESS: "В работе",
    PAUSED: "Пауза",
    CLOSED: "Закрыт",
    PAID: "Оплачен",
};
