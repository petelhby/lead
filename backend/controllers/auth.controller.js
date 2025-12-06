const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const COOKIE_NAME = 'token';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const isProd = process.env.NODE_ENV === 'production';

function cookieOptions() {
    const sameSite = process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax');
    const secure = process.env.COOKIE_SECURE === 'true' || (isProd && sameSite === 'none');

    return {
        httpOnly: true,
        sameSite,
        secure,
        path: '/',
    };
}

const registerWorker = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email и пароль обязательны' });

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ message: 'Пользователь с этим email уже существует' });

        const hash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { name: name || email, email, password: hash, role: 'WORKER' },
            select: { id: true, name: true, email: true, role: true },
        });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie(COOKIE_NAME, token, cookieOptions());

        return res.status(201).json({ user });
    } catch (err) {
        return res.status(500).json({ message: 'Register failed', error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email и пароль обязательны' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ message: 'Неверный логин или пароль' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie(COOKIE_NAME, token, cookieOptions());

        return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        return res.status(500).json({ message: 'Login failed', error: err.message });
    }
};

const me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, role: true },
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.json({ user });
    } catch (err) {
        return res.status(500).json({ message: 'Could not fetch user', error: err.message });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie(COOKIE_NAME, { path: '/' });
        return res.json({ message: 'Logged out' });
    } catch (err) {
        return res.status(500).json({ message: 'Logout failed', error: err.message });
    }
};

module.exports = { registerWorker, login, me, logout };
