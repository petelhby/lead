"use client";

import React, { useCallback, useMemo, useRef } from "react";

type Props = {
    files: File[];
    onChange: (files: File[]) => void;
    disabled?: boolean;
};

/**
 * Универсальный выбор вложений:
 *  - одно место для добавления любых файлов (изображения, видео, архивы, документы, таблицы)
 *  - drag&drop
 *  - список с удалением
 */
export default function UploadAttachments({ files, onChange, disabled }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const accept = useMemo(
        () =>
            [
                "image/*",
                "video/*",
                ".zip",
                ".rar",
                ".7z",
                ".pdf",
                ".doc",
                ".docx",
                ".xls",
                ".xlsx",
                ".csv",
                ".txt",
            ].join(","),
        []
    );

    const openPicker = useCallback(() => {
        if (disabled) return;
        inputRef.current?.click();
    }, [disabled]);

    const onInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files) return;
            const list = Array.from(e.target.files);
            if (list.length === 0) return;
            onChange([...(files || []), ...list]);
            e.target.value = "";
        },
        [files, onChange]
    );

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            if (disabled) return;
            const dtFiles = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
            if (dtFiles.length === 0) return;
            onChange([...(files || []), ...dtFiles]);
        },
        [files, onChange, disabled]
    );

    const onRemove = useCallback(
        (idx: number) => {
            const next = [...files];
            next.splice(idx, 1);
            onChange(next);
        },
        [files, onChange]
    );

    const prevent = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className="space-y-3">
            {/* Зона drop / кнопка */}
            <div
                className={`rounded-xl border border-dashed p-4 bg-slate-50/40 ${disabled ? "opacity-60 pointer-events-none" : "hover:bg-slate-50"
                    }`}
                onDragOver={prevent}
                onDragEnter={prevent}
                onDragLeave={prevent}
                onDrop={onDrop}
            >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm text-slate-600">
                        Перетащите файлы сюда или нажмите «Прикрепить файлы».
                        <div className="text-xs text-slate-500 mt-1">
                            Поддерживаются изображения, видео, архивы, PDF, Word, Excel, CSV, TXT.
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={openPicker}
                        className="h-9 px-4 rounded-lg text-white border border-[#0160C9] bg-[#0160C9] hover:bg-[#077cfd]/80 transition"
                    >
                        Прикрепить файлы
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept={accept}
                        className="hidden"
                        onChange={onInput}
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* Локальный список выбранных (до отправки) */}
            {files.length > 0 && (
                <div className="rounded-xl bg-white border p-3">
                    <div className="text-sm font-medium mb-2">Будут загружены:</div>
                    <ul className="space-y-1">
                        {files.map((f, i) => (
                            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="truncate">{f.name}</div>
                                    <div className="text-xs text-slate-500">{(f.size / 1024).toFixed(1)} KB</div>
                                </div>
                                <button
                                    type="button"
                                    className="text-sm px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700"
                                    onClick={() => onRemove(i)}
                                >
                                    Удалить
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
