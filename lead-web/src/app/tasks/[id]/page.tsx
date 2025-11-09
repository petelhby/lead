"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Task, TaskEntry } from "@/lib/types";
import UploadPhotos from "@/components/UploadPhotos";
import { useParams } from "next/navigation";

export default function TaskPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [task, setTask] = useState<Task | null>(null);
  const [entries, setEntries] = useState<TaskEntry[]>([]);
  const [report, setReport] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      // нет GET /api/tasks/:id — берём all и находим нужную
      const all: Task[] = await api(`/api/tasks/all`, { auth: true });
      const t = all.find(x => Number(x.id) === id) || null;
      setTask(t);

      const es: TaskEntry[] = await api(`/api/tasks/${id}/entries`, { auth: true });
      setEntries(es);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function addReport() {
    try {
      // taskEntry: POST /api/tasks/:id/entries — можно отправлять только текст (multipart)
      const form = new FormData();
      if (report) form.append("report", report);
      // без файлов — бэкенд примет текстовую запись
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/tasks/${id}/entries`, {
        method: "POST",
        headers: (() => {
          const h: HeadersInit = {};
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
          if (token) h["Authorization"] = `Bearer ${token}`;
          return h;
        })(),
        body: form
      }).then(async r => { if (!r.ok) throw new Error(await r.text()); });

      setReport("");
      await load();
    } catch (e: any) { setError(e.message) }
  }

  if (!task) return <div>Загрузка… {error && <span className="text-red-600">{error}</span>}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{task.title}</h1>
          <p className="text-slate-700 max-w-3xl">{task.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Новая запись</h2>
        <div className="flex items-center gap-2">
          <input className="border rounded px-3 py-2 flex-1" placeholder="Текст отчёта" value={report} onChange={e => setReport(e.target.value)} />
          <button onClick={addReport} className="px-3 py-2 rounded bg-black text-white">Сохранить</button>
          <UploadPhotos taskId={id} onUploaded={load} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Лента записей</h2>
        {entries.length === 0 && <div className="text-sm text-slate-600">Нет записей</div>}
        {entries.map(e => (
          <div key={e.id} className="border bg-white rounded p-3 space-y-2">
            <div className="text-sm text-slate-600">{new Date(e.createdAt).toLocaleString()} {e.author?.name ? ` · ${e.author.name}` : ''}</div>
            {e.report && <div>{e.report}</div>}
            {Array.isArray(e.photos) && e.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {e.photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" className="block">
                    <img src={url} alt="photo" className="w-full h-32 object-cover rounded" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
