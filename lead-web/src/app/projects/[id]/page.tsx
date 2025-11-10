"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import type { Task } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { useParams } from "next/navigation";

export default function ProjectTasks() {
  const params = useParams();
  const projectId = Number(params?.id);
  const [items, setItems] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    // Бэкенд не имеет GET /api/tasks?projectId=...
    // Берём /api/tasks/all и фильтруем по projectId на клиенте
    api(`/api/tasks/all`, { auth: true })
      .then((list: Task[]) => {
        console.log("SAMPLE TASK", list[0]);
        setItems(list.filter((t: Task) => Number(t.projectId) === projectId));
      })
      .catch(e => setError(e.message));
  }, [projectId]);


  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Задачи проекта</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="space-y-2">
        {items.map(t => (
          <Link key={t.id} href={`/tasks/${t.id}`} className="block border bg-white rounded p-3 hover:shadow">
            <div className="font-medium">{t.title}</div>
            <div className="text-sm text-slate-600 line-clamp-2">{t.description}</div>
            <div className="mt-1"><StatusBadge status={t.status} /></div>
          </Link>
        ))}
        {items.length === 0 && <div className="text-sm text-slate-600">Задач для этого проекта нет</div>}
      </div>
    </div>

  );
}
