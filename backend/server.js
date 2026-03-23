import express   from 'express';
import cors      from 'cors';
import helmet    from 'helmet';
import morgan    from 'morgan';
import dotenv    from 'dotenv';
import connectDB from './config/db.js';
import { seedWallets } from './controllers/walletController.js';
import { getSettings }  from './controllers/adminController.js';

import authRoutes  from './routes/auth.js';
import userRoutes  from './routes/user.js';
import adminRoutes from './routes/admin.js';

dotenv.config();
connectDB().then(() => seedWallets());

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'https://novapays-git-main-kosisochukwu123s-projects.vercel.app',
      'https://novapays.vercel.app',
    ].filter(Boolean);

    if (allowed.some(a => origin.startsWith(a))) {
      callback(null, true);
    } else {
      console.log('CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle all preflight OPTIONS requests
app.options('/{*path}', cors());

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Public routes ──────────────────────────────────────────────────────────
app.get('/api/health',   (_, res) => res.json({ status: 'ok', time: new Date() }));
app.get('/api/settings', getSettings);

// ── App routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/user',  userRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));