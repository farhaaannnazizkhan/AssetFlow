import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import prisma from './utils/prisma';
import cron from 'node-cron';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

cron.schedule('0 0 * * *', async () => {
  console.log('Running daily overdue check...');
  try {
    const overdueAllocations = await prisma.allocation.findMany({
      where: {
        status: 'ACTIVE',
        expectedReturnDate: { lt: new Date() },
      },
      include: {
        asset: { select: { assetTag: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });

    for (const allocation of overdueAllocations) {
      await prisma.allocation.update({
        where: { id: allocation.id },
        data: { status: 'OVERDUE' },
      });

      await prisma.notification.create({
        data: {
          userId: allocation.userId,
          type: 'OVERDUE_RETURN',
          message: `Asset ${allocation.asset.assetTag} (${allocation.asset.name}) is overdue for return. Expected return date was ${allocation.expectedReturnDate?.toISOString().split('T')[0]}.`,
        },
      });
    }

    console.log(`Overdue check completed. ${overdueAllocations.length} overdue allocations found.`);
  } catch (error) {
    console.error('Overdue check error:', error);
  }
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

startServer();

export default app;
