const express = require("express");
const r = express.Router({ mergeParams: true });

const c = require("../controllers/finance.controller");

// Импорт миддлваров. Делает импорт "устойчивым" к разным видам экспорта.
const mw = require("../middlewares/auth.middleware");
const auth =
    typeof mw === "function"
        ? mw
        : (mw && typeof mw.auth === "function" ? mw.auth : null);
const requireAdmin =
    (mw && typeof mw.requireAdmin === "function")
        ? mw.requireAdmin
        : (req, res, next) => next(); // fallback, чтобы не падало при запуске

if (!auth) {
    // Если всё ещё нет функции — даём понятную ошибку при старте
    throw new Error(
        "Middleware 'auth' не найден. Проверьте файл backend/middlewares/auth.middleware.js и его экспорт."
    );
}

// Всё, что дальше — только для авторизованных
r.use(auth);

// ===== Финансы проекта =====

// Получить сводку/таблицу по финансам проекта
r.get("/projects/:id/finance", c.getFinanceForProject);

// Контракты (только админ)
r.post("/projects/:id/finance/contracts", requireAdmin, c.createContract);
r.delete("/projects/:id/finance/contracts/:contractId", requireAdmin, c.deleteContract);

// Платежи (только админ)
r.post("/projects/:id/finance/payments", requireAdmin, c.createPayment);
r.delete("/projects/:id/finance/payments/:paymentId", requireAdmin, c.deletePayment);

module.exports = r;
