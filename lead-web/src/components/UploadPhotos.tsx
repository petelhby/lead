"use client";
import { useRef } from "react";

/**
 * Компонент НЕ загружает файлы сам!
 * Он только даёт выбрать картинки, показывает их превью и позволяет удалять.
 * Сами файлы хранятся снаружи (в родителе) — через props.files / onChange.
 */
export default function UploadPhotos({
  files,
  onChange,
  disabled = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function pick() {
    if (!disabled) inputRef.current?.click();
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list || !list.length) return;

    // Добавим новые выбранные файлы к уже выбранным
    const next: File[] = [...files, ...Array.from(list)];

    // (Опционально) легкая дедупликация по имени+размеру
    const unique = Array.from(
      new Map(next.map((f) => [`${f.name}_${f.size}`, f])).values()
    );

    onChange(unique);
    // Сбросим инпут, чтобы можно было выбрать те же файлы ещё раз
    e.currentTarget.value = "";
  }

  function removeAt(idx: number) {
    const next = files.slice();
    next.splice(idx, 1);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={pick}
        disabled={disabled}
        className="px-3 py-2 border rounded bg-white hover:bg-slate-50 disabled:opacity-60"
      >
        Загрузить фото
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />

      {/* Превью */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {files.map((file, i) => {
            const url = URL.createObjectURL(file);
            return (
              <div key={`${file.name}_${i}`} className="relative group">
                <img
                  src={url}
                  alt={file.name}
                  className="w-full h-40 object-cover rounded-lg border"
                />
                {/* Кнопка удаления в правом верхнем углу */}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 text-white font-bold leading-none flex items-center justify-center shadow group-hover:opacity-100 opacity-90"
                  title="Удалить"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
