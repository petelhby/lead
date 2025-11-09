export type Role = "ADMIN" | "WORKER";

export interface User { id: number; email: string; name?: string; role: Role }
export interface Project { id: number; name: string; slug: string; status: "IN_PROGRESS"|"PAUSED"|"CLOSED"|"PAID"; createdAt: string }
export interface Task { id: number; title: string; slug: string; description?: string; status: string; projectId: number; assigneeId?: number; createdAt: string; dueDate?: string }
export interface TaskEntry { id: number; taskId: number; authorId: number; report?: string; photos: string[]; createdAt: string; author?: User }
