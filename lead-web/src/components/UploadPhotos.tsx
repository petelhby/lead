"use client";
import { useState } from "react";

export default function UploadPhotos({ taskId, onUploaded }: { taskId: number; onUploaded: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const form = new FormData();
    for (const file of Array.from(e.target.files)) form.append("photo", file); // <-- имя поля photo

    setBusy(true); setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/tasks/${taskId}/entries`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form
      });
      if (!res.ok) throw new Error(await res.text());
      onUploaded();
    } catch (e: any) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="px-3 py-2 border rounded bg-white cursor-pointer">
        {busy ? 'Загрузка…' : 'Загрузить фото'}
        <input type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
      </label>
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </div>
  );
}
