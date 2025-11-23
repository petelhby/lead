// src/components/ProjectStatusBadge.tsx
import { PROJECT_STATUS_MAP, ProjectStatus } from "@/lib/projectStatus";

const COLOR: Record<ProjectStatus, string> = {
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    PAUSED: "bg-amber-100 text-amber-700",
    CLOSED: "bg-slate-200 text-slate-700",
    PAID: "bg-emerald-100 text-emerald-700",
};

export default function ProjectStatusBadge({ status }: { status: ProjectStatus | string }) {
    const key = (status as ProjectStatus) in PROJECT_STATUS_MAP
        ? (status as ProjectStatus)
        : "IN_PROGRESS";
    const label = PROJECT_STATUS_MAP[key];
    return (
        <span className={`px-2 py-1 text-xs rounded-md ${COLOR[key]}`}>{label}</span>
    );
}
