const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** Проверяем, админ ли пользователь */
function isAdmin(req) {
    const r = String(req?.user?.role || "").trim().toUpperCase();
    return r === "ADMIN" || r === "ROLE_ADMIN" || r === "SUPERADMIN" || r === "SUPER_ADMIN";
}

/** Безопасно получить базовое имя файла */
function safeBaseName(p) {
    if (!p) return "";
    const s = String(p).replace(/\\/g, "/");
    return s.split("/").pop() || "";
}

/** Сконструировать относительный путь для сохранения */
function buildRelPath(req, fileName) {
    const clean = safeBaseName(fileName) || "file.bin";
    // upload.middleware кладёт relDir вроде /uploads/project_12/task_34
    if (req._uploadCtx?.relDir) {
        return `${req._uploadCtx.relDir}/${clean}`.replace(/\\/g, "/");
    }
    // Фоллбек — просто кладём в /uploads
    return `/uploads/${clean}`;
}

/** Разнести загруженные файлы по массивам: photos[] (изображения) и files[] (остальное) */
function splitFilesByType(req) {
    const photosIn = Array.isArray(req.files?.photos) ? req.files.photos : [];
    const filesIn = Array.isArray(req.files?.files) ? req.files.files : [];

    // Если фронт чётко разделил поля — используем как есть
    const photos = photosIn.map(f => buildRelPath(req, f.filename || f.originalname || f.path));
    const files = filesIn.map(f => buildRelPath(req, f.filename || f.originalname || f.path));

    // На всякий случай — если прислали в одно поле, разнесём по mimetype
    const others = []
        .concat(photosIn.length ? [] : (Array.isArray(req.files) ? req.files : []))
        .concat(filesIn.length ? [] : (Array.isArray(req.files) ? req.files : []));

    for (const f of others) {
        if (!f) continue;
        const mt = String(f.mimetype || "").toLowerCase();
        const rel = buildRelPath(req, f.filename || f.originalname || f.path);
        if (mt.startsWith("image/")) photos.push(rel);
        else files.push(rel);
    }

    // Убираем пустые и дубликаты
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
    return { photos: uniq(photos), files: uniq(files) };
}

/** Создать запись (комментарий + файлы) */
const createTaskEntry = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Требуется авторизация" });
        }

        const taskId = Number(req.params.id);
        if (!taskId) {
            return res.status(400).json({ message: "Некорректный идентификатор задачи" });
        }

        const report = typeof req.body?.report === "string" ? req.body.report.trim() : "";

        // Разнесём загруженные файлы
        const { photos, files } = splitFilesByType(req);

        const newEntry = await prisma.taskEntry.create({
            data: {
                taskId,
                report,                // текст комментария (может быть пустым)
                photos,                // массив строк '/uploads/project_X/task_Y/…'
                files,                 // массив строк '/uploads/project_X/task_Y/…'
                authorId: Number(req.user.id),
            },
        });

        res.status(201).json(newEntry);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Не удалось создать запись", error: e.message });
    }
};

/** Список записей задачи (с автором) */
const getTaskEntries = async (req, res) => {
    try {
        const taskId = Number(req.params.id);
        if (!taskId) {
            return res.status(400).json({ message: "Некорректный идентификатор задачи" });
        }

        const entries = await prisma.taskEntry.findMany({
            where: { taskId },
            include: {
                author: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
        });

        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Ошибка при получении записей", error: err.message });
    }
};

/** Удалить запись (ADMIN — любую; иначе — только свою) */
const deleteTaskEntry = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Требуется авторизация" });
        }

        const taskId = Number(req.params.taskId);
        const entryId = Number(req.params.entryId);
        if (!taskId || !entryId) {
            return res.status(400).json({ message: "Некорректные идентификаторы" });
        }

        const entry = await prisma.taskEntry.findUnique({
            where: { id: entryId },
            include: { author: { select: { id: true } } },
        });

        if (!entry || entry.taskId !== taskId) {
            return res.status(404).json({ message: "Запись не найдена" });
        }

        const can = isAdmin(req) || (entry.author?.id && entry.author.id === Number(req.user.id));
        if (!can) {
            return res.status(403).json({ message: "Недостаточно прав" });
        }

        // Если нужно физически удалять файлы — раскомментируй:
        // const root = path.resolve(process.cwd(), "uploads");
        // const tryUnlink = (rel) => {
        //   if (!rel) return;
        //   const base = safeBaseName(rel);
        //   // Путь вида /uploads/project_x/task_y/file => удаляем по абсолютному
        //   const abs = path.join(process.cwd(), rel.replace(/^\//, ""));
        //   try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch {}
        // };
        // (entry.photos || []).forEach(tryUnlink);
        // (entry.files  || []).forEach(tryUnlink);

        await prisma.taskEntry.delete({ where: { id: entryId } });
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Не удалось удалить запись", error: e.message });
    }
};

module.exports = { createTaskEntry, getTaskEntries, deleteTaskEntry };
