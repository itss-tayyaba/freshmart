import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB, isDbOnline } from '../server/config/db.js';
import { corsOptions } from '../server/config/corsOptions.js';
import '../server/models/Admin.js';
import '../server/models/PickupStaff.js';
import '../server/models/ExtraModels.js';
import '../server/models/User.js';
import apiRoutes from '../server/routes/apiRoutes.js';
import { notFound, errorHandler } from '../server/middleware/errorMiddleware.js';
import { apiLimiter } from '../server/middleware/rateLimitMiddleware.js';

dotenv.config();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '200kb' }));

// Serverless DB Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('Vercel serverless DB connect error:', err.message);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const online = isDbOnline();
  res.json({
    status: 'Healthy',
    platform: 'Vercel Serverless Function',
    database: online ? 'Connected (MongoDB Atlas)' : 'Active (In-Memory Store)',
    dbConnected: online,
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'FreshMart Grocery REST API',
    status: 'Active',
    platform: 'Vercel Serverless Function'
  });
});

app.use('/api', apiLimiter);
app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
