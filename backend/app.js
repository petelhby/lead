const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

app.use(cors());
app.use(express.json());

// СТАТИКА /uploads -> backend/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cookieParser());
app.use(cors({ origin: process.env.FRONT_ORIGIN || 'http://localhost:3000', credentials: true }));

// Роуты
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const userRoutes = require('./routes/user.routes');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Тест
app.get('/', (req, res) => {
    res.send('API is working');
});

// НЕ подключай отдельно taskEntry.routes.js, чтобы не дублировать
// const taskEntryRoutes = require('./routes/taskEntry.routes');
// app.use('/api/tasks', taskEntryRoutes);

module.exports = app;
