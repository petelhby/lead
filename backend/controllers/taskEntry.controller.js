const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** Приводим путь к виду '/uploads/xxx.jpg' + слэши -> '/' */
function normalizeStoredPath(absOrRel) {
    if (!absOrRel) return absOrRel;
    const s = String(absOrRel).replace(/\\/g, "/");
    if (/^\/uploads\//.test(s)) return s;
    const name = s.split("/").pop();
    return name ? `/uploads/${name}` : s;
}

function isAdmin(req) {
    return req?.user?.role === "ADMIN";
}

/** Создать запись (комментарий и/или фото) */
const createTaskEntry = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Требуется авторизация" });
        }

        const taskId = Number(req.params.id);
        if (!taskId) {
            return res.status(400).json({ message: "Некорректный идентификатор задачи" });
        }

        const report =
            typeof req.body?.report === "string" ? req.body.report.trim() : "";

        // Ожидаем, что файлы уже сохранены в /uploads (multer.diskStorage в роуте)
        const photosRaw = (req.files || []).map((f) => f.path || f.filename || "");
        const photos = photosRaw.map(normalizeStoredPath).filter(Boolean);

        const newEntry = await prisma.taskEntry.create({
            data: {
                taskId,
                report,              // пустая строка допустима
                photos,              // массив строк '/uploads/..'
                authorId: req.user.id,
            },
        });

        res.status(201).json(newEntry);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Не удалось создать запись", error: e.message });
    }
};

/** Получить все записи задачи (с автором) */
const getTaskEntries = async (req, res) => {
    try {
        const { id } = req.params;
        const taskId = Number(id);
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

/**
 * Удалить запись:
 *  - ADMIN может удалить любую
 *  - иначе — только автор
 */
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

        const can =
            isAdmin(req) ||
            (entry.author?.id && entry.author.id === req.user.id);

        if (!can) {
            return res.status(403).json({ message: "Недостаточно прав" });
        }

        // Если захочешь удалять файлы физически — раскомментируй:
        // (Сохраняем только безопасные базовые имена, чтобы не уйти за пределы каталога)
        // for (const p of entry.photos || []) {
        //   if (!p) continue;
        //   const base = path.basename(p); // защита от '../'
        //   const abs = path.resolve(process.cwd(), "uploads", base);
        //   if (fs.existsSync(abs)) {
        //     try { fs.unlinkSync(abs); } catch (e) { /* noop */ }
        //   }
        // }

        await prisma.taskEntry.delete({ where: { id: entryId } });
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Не удалось удалить запись", error: e.message });
    }
};

module.exports = { createTaskEntry, getTaskEntries, deleteTaskEntry };
