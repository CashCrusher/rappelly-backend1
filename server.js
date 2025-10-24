import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import contactsRoutes from './routes/contacts.js';
import relanceRoutes from './routes/relance.js';
import settingsRoutes from './routes/settings.js';
import { startCronJobs } from './services/cronService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Start cron jobs for scheduled emails
startCronJobs();

// Routes
app.use('/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/relance', relanceRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rappelly server running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Rappelly server running on http://localhost:${PORT}`);
});