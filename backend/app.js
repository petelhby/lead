const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());

// Роуты
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const userRoutes = require('./routes/user.routes'); // добавили для /users/workers

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/tasks', taskRoutes);

app.use('/api/users', userRoutes);

// Тестовый маршрут
app.get('/', (req, res) => {
    res.send('API is working');
});
const taskEntryRoutes = require('./routes/taskEntry.routes');
app.use('/api/tasks', taskEntryRoutes); // ✅ маршрут для вложенных записей

module.exports = app;

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
