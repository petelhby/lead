// backend/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

/**
 * Базовый миддлвар: проверка JWT
 * Источники токена:
 * 1) Authorization: Bearer <token>
 * 2) cookie "token" (fallback)
 */
function auth(req, res, next) {
    try {
        let token = null;

        // 1) из Authorization
        const h = req.headers.authorization || "";
        const m = h.match(/^Bearer\s+(.+)$/i);
        if (m) token = m[1];

        // 2) из куки (если не пришел в header)
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) return res.status(401).json({ message: "No token provided" });

        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

/**
 * Проверка роли
 */
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        if (req.user.role !== role) return res.status(403).json({ message: "Forbidden" });
        next();
    };
}

const requireAdmin = requireRole("ADMIN");

module.exports = {
    auth,
    verifyToken: auth,
    requireRole,
    requireAdmin,
};
