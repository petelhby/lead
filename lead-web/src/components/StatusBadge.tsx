import { clsx } from "clsx";

export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Новая": "bg-gray-200 text-gray-800",
    "Принят к исполнению": "bg-blue-200 text-blue-800",
    "Выполнен, требует проверки": "bg-yellow-200 text-yellow-800",
    "Закрыта": "bg-green-200 text-green-800",
    "IN_PROGRESS": "bg-blue-200 text-blue-800",
    "PAUSED": "bg-yellow-200 text-yellow-800",
    "CLOSED": "bg-gray-300 text-gray-800",
    "PAID": "bg-green-200 text-green-800"
  };
  return <span className={clsx("px-2 py-1 rounded text-xs", map[status] || "bg-slate-200")}>{status}</span>
}
