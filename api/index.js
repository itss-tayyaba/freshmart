import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../server/config/db.js';
import apiRoutes from '../server/routes/apiRoutes.js';
import { notFound, errorHandler } from '../server/middleware/errorMiddleware.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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
  res.json({
    status: 'Healthy',
    platform: 'Vercel Serverless Function',
    database: 'MongoDB Atlas',
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

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
