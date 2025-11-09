const app = require('./app');
const sequelize = require('./config/database'); // если бы мы были с Sequelize
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// const PORT = process.env.PORT || 3001;
const PORT = 3001;

app.listen(PORT, '0.0.0.0', async () => {
    try {
        await prisma.$connect();
        console.log('✅ Connected to PostgreSQL via Prisma');
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    } catch (err) {
        console.error('❌ DB connection failed:', err);
    }
});
