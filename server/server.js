import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB, isDbOnline } from './config/db.js';
import apiRoutes from './routes/apiRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { Product } from './models/Product.js';
import { Supplier } from './models/ExtraModels.js';
import { FRESHMART_PRODUCTS } from '../src/data/freshMartData.js';

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

async function seedInitialDatabase() {
  try {
    if (isDbOnline()) {
      // Seed all 15 Coca-Cola and other store products if not existing
      for (const p of FRESHMART_PRODUCTS) {
        const exists = await Product.findOne({ $or: [{ customId: p.id }, { id: p.id }, { name: p.name }] });
        if (!exists) {
          await Product.create({
            customId: p.id,
            id: p.id,
            name: p.name,
            brand: p.brand || 'Coca-Cola',
            category: p.category || 'beverages',
            categoryLabel: p.categoryLabel || 'Beverages',
            price: Number(p.price),
            originalPrice: Number(p.originalPrice || p.price),
            discountPercent: Number(p.discountPercent || 0),
            unit: p.unit || '1 Pack',
            stock: Number(p.stockCount || p.stock || 100),
            image: p.image,
            description: p.description,
            status: 'Active'
          });
        }
      }

      // Seed Tayyab Coca-Cola supplier if not existing
      const cocaSupplier = await Supplier.findOne({ $or: [{ username: 'tayyab' }, { name: /Tayyab/i }, { username: 'coca_cola' }] });
      if (!cocaSupplier) {
        await Supplier.create({
          id: 'SUP-101',
          supplierId: 'SUP-101',
          name: 'Tayyab (Coca-Cola Beverages)',
          contact: 'Tayyab',
          phone: '0300-8765432',
          email: 'tayyab.cocacola@freshmart.pk',
          category: 'Beverages, Juices & Soft Drinks',
          username: 'tayyab',
          password: 'cocacola123',
          status: 'Active'
        });
      }
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

async function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`🚀 FreshMart Node.js + Express Server running on port ${PORT}`);
    console.log(`📡 API Endpoints available at: http://localhost:${PORT}/api`);
  });

  // Connect to DB and seed in the background
  connectDB()
    .then(() => seedInitialDatabase())
    .catch((err) => console.warn('DB connect/seed error:', err.message));

  // Keep node event loop actively alive
  setInterval(() => {}, 1000 * 60 * 60);
}

startServer();
