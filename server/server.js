import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/apiRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'FreshMart Grocery E-Commerce REST API',
    version: '1.0.0',
    status: 'Active',
    database: 'MongoDB (Mongoose)',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'Healthy',
    database: 'MongoDB / Express REST Server Active',
    services: {
      auth: 'Online',
      products: 'Online',
      orders: 'Online',
      deliveryTracking: 'Online',
      analytics: 'Online'
    }
  });
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 FreshMart Node.js + Express Server running on port ${PORT}`);
    console.log(`📡 API Endpoints available at: http://localhost:${PORT}/api`);
  });

  // Keep node event loop actively alive
  setInterval(() => {}, 1000 * 60 * 60);
}

startServer();
