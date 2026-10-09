import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { standardLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getDb } from './db/connection.js';

const app = express();

// Security and middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: '*', // Allow frontend dev server and public demo
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(standardLimiter);

// Static uploads with privacy: no directory indexing
const uploadsPath = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath, { index: false }));

// API routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CityPulse-API', timestamp: Date.now() });
});

// Error handling middleware
app.use(errorHandler);

// Initialize DB and start server
async function startServer() {
  try {
    await getDb();
    app.listen(env.PORT, () => {
      console.log(`🚀 CityPulse Backend API listening on http://localhost:${env.PORT}`);
      console.log(`🌐 City configuration active (Pune default, Mumbai and all Indian cities supported)`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
