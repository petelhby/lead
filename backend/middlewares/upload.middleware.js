const fs = require("fs");
const path = require("path");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

/* =======================
 *   Авторизация / Роли
 * ======================= */
function auth(req, res, next) {
    try {
        const h = req.headers.authorization || "";
        const m = h.match(/^Bearer\s+(.+)$/i);
        if (!m) return res.status(401).json({ message: "No token provided" });

        const token = m[1];
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; // { id, role, name, ... }
        return next();
    } catch (e) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

function requireRole(required) {
    const normalize = (r) => {
        const up = String(r || "").trim().toUpperCase();
        if (up === "ROLE_ADMIN" || up === "SUPERADMIN" || up === "SUPER_ADMIN") return "ADMIN";
        return up;
    };
    const need = normalize(required);
    return (req, res, next) => {
        if (normalize(req.user?.role) === need) return next();
        return res.status(403).json({ message: `Access denied: require role ${need}` });
    };
}
const requireAdmin = requireRole("ADMIN");

/* =======================
 *   Утилиты
 * ======================= */
function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function sanitizeName(name) {
    // латиница/цифры/._-()+@ + кириллица
    return String(name)
        .replace(/[^\w.\-()+@\u0400-\u04FF]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 180);
}

// где лежит папка uploads (из app.js мы раздаём __dirname + '/uploads')
const UPLOADS_BASE_ABS = path.join(__dirname, "..", "uploads");

/**
 * Готовим контекст загрузки: знаем taskId, находим projectId,
 * создаём папку uploads/project_<pid>/task_<tid> и кладём в req._uploadCtx.
 */
async function prepareUploadDirs(req, res, next) {
    try {
        const taskId = Number(req.params?.id);
        if (!taskId) return res.status(400).json({ message: "Некорректный идентификатор задачи" });

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { id: true, projectId: true },
        });
        if (!task) return res.status(404).json({ message: "Задача не найдена" });

        const projectId = Number(task.projectId);
        if (!projectId) return res.status(400).json({ message: "У задачи не указан проект" });

        const relDir = path.posix.join("uploads", `project_${projectId}`, `task_${taskId}`);
        const absDir = path.join(UPLOADS_BASE_ABS, `project_${projectId}`, `task_${taskId}`);

        ensureDir(absDir);

        req._uploadCtx = { taskId, projectId, relDir: `/${relDir}`, absDir };
        next();
    } catch (e) {
        next(e);
    }
}

/* =======================
 *   Multer storage
 * ======================= */
// Разрешённые типы
const allowed = new Set([
    // картинки
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/heic", "image/heif",
    // видео
    "video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska",
    // документы/архивы/текст
    "application/pdf",
    "application/zip", "application/x-zip-compressed",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/plain",
]);

function fileFilter(req, file, cb) {
    if (allowed.has(file.mimetype)) return cb(null, true);
    return cb(new Error(`Тип файла не поддерживается: ${file.mimetype}`));
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const abs = req._uploadCtx?.absDir || UPLOADS_BASE_ABS;
        try {
            ensureDir(abs);
            cb(null, abs);
        } catch (e) {
            cb(e);
        }
    },
    filename: function (req, file, cb) {
        const ts = Date.now();
        const safe = sanitizeName(file.originalname || "file.bin");
        cb(null, `${ts}_${safe}`);
    },
});

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024, files: 20 }, // 50MB / файл, до 20 файлов
});

/**
 * Комплект для маршрута POST /api/tasks/:id/entries
 *  - auth: проверка JWT
 *  - prepareUploadDirs: достаёт projectId и готовит директорию
 *  - upload.fields: кладёт файлы в нужную папку
 */
const uploadPhotosAndFiles = [
    auth,
    prepareUploadDirs,
    upload.fields([
        { name: "photos", maxCount: 20 },
        { name: "files", maxCount: 20 },
    ]),
];

module.exports = {
    // авторизация
    auth,
    verifyToken: auth,
    requireRole,
    requireAdmin,

    // загрузка
    prepareUploadDirs,
    uploadPhotosAndFiles,
};
