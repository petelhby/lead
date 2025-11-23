const app = require('./app');
const path = require('path');
const fs = require('fs');
const express = require('express');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Гарантируем, что папка uploads существует
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Раздаём загруженные файлы по URL вида /uploads/...
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// const PORT = process.env.PORT || 3001;
const PORT = 3001;

app.listen(PORT, '0.0.0.0', async () => {
    try {
        await prisma.$connect();
        console.log('✅ Connected to PostgreSQL via Prisma');
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log(`🖼  Static uploads at http://localhost:${PORT}/uploads/`);
    } catch (err) {
        console.error('❌ DB connection failed:', err);
    }
});