import express    from 'express';
import cors       from 'cors';
import helmet     from 'helmet';
import morgan     from 'morgan';
import dotenv     from 'dotenv';
import connectDB  from './config/db.js';
import { seedWallets } from './controllers/walletController.js';
import { getSettings } from './controllers/adminController.js';  // ← add this

import authRoutes  from './routes/auth.js';
import userRoutes  from './routes/user.js';
import adminRoutes from './routes/admin.js';

dotenv.config();
connectDB().then(() => seedWallets());

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Public routes (no auth) ────────────────────────────────────────────────
app.get('/api/health',   (_, res) => res.json({ status: 'ok', time: new Date() }));
app.get('/api/settings', getSettings);   // ← branding used by all pages

// ── Protected routes ───────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/user',  userRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));