"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const prisma_1 = __importDefault(require("./utils/prisma"));
const node_cron_1 = __importDefault(require("node-cron"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static('uploads'));
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.use('/api', routes_1.default);
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
node_cron_1.default.schedule('0 0 * * *', async () => {
    console.log('Running daily overdue check...');
    try {
        const overdueAllocations = await prisma_1.default.allocation.findMany({
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
            await prisma_1.default.allocation.update({
                where: { id: allocation.id },
                data: { status: 'OVERDUE' },
            });
            await prisma_1.default.notification.create({
                data: {
                    userId: allocation.userId,
                    type: 'OVERDUE_RETURN',
                    message: `Asset ${allocation.asset.assetTag} (${allocation.asset.name}) is overdue for return. Expected return date was ${allocation.expectedReturnDate?.toISOString().split('T')[0]}.`,
                },
            });
        }
        console.log(`Overdue check completed. ${overdueAllocations.length} overdue allocations found.`);
    }
    catch (error) {
        console.error('Overdue check error:', error);
    }
});
async function startServer() {
    try {
        await prisma_1.default.$connect();
        console.log('Database connected successfully');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map