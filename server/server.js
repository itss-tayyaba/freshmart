import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB, isDbOnline, getDbStatus } from './config/db.js';
import { corsOptions } from './config/corsOptions.js';
import apiRoutes from './routes/apiRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import { Product } from './models/Product.js';
import { Category } from './models/Category.js';
import { Company } from './models/Company.js';
import { Branch } from './models/Branch.js';
import { Store } from './models/Store.js';
import { DeliveryZone } from './models/DeliveryZone.js';
import { ZoneStore } from './models/ZoneStore.js';
import { Supplier } from './models/ExtraModels.js';
import { seedCoreEntities } from './config/seedCoreEntities.js';
import { loadDiskZones } from './controllers/zoneController.js';
import { loadDiskStores } from './controllers/storeController.js';
import { loadDiskBranches } from './controllers/companyBranchController.js';
import { loadDiskAssignments } from './controllers/assignmentController.js';
import { FRESHMART_PRODUCTS } from '../src/data/freshMartData.js';
import { ALL_BRANCH_PRODUCTS } from '../src/data/branchCatalogData.js';
import { STORE_DEPARTMENTS, getDepartmentById } from '../src/data/departmentData.js';
import { COMPANIES, BRANCHES } from '../src/data/companyHierarchyData.js';

dotenv.config();

const app = express();

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '200kb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'FreshMart Super Grocery Multi-Tenant REST API',
    version: '2.0.0',
    status: 'Active',
    database: isDbOnline() ? 'MongoDB Atlas (Connected)' : 'In-Memory Fallback',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    status: 'Healthy',
    database: dbStatus.online ? 'MongoDB Atlas Active' : 'In-Memory Store Active',
    dbDetails: dbStatus,
    services: {
      auth: 'Online',
      products: 'Online',
      departments: 'Online',
      orders: 'Online',
      deliveryTracking: 'Online',
      analytics: 'Online'
    }
  });
});

app.get('/api/db-status', (req, res) => {
  res.json({
    success: true,
    database: getDbStatus()
  });
});

// API Routes
app.use('/api', apiLimiter);
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function seedInitialDatabase() {
  try {
    if (!isDbOnline()) return;

    // 1. Synchronize Companies if missing
    const companyCount = await Company.countDocuments();
    if (companyCount === 0) {
      console.log('🔄 Syncing Companies into MongoDB...');
      for (const c of COMPANIES) {
        await Company.findOneAndUpdate(
          { _id: c._id },
          {
            _id: c._id,
            tenantId: c.tenantId,
            name: c.name,
            slug: c.slug,
            logo: c.logo || '',
            banner: c.banner || '',
            status: c.status || 'active',
            tagline: c.tagline || '',
            themeColor: c.themeColor || '#047857'
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      console.log(`✅ ${COMPANIES.length} Companies synced.`);
    }

    // 2. Synchronize Branches and Delivery Polygons into MongoDB
    const diskBranches = loadDiskBranches();
    const branchCount = await Branch.countDocuments();
    if (branchCount === 0) {
      console.log('🔄 Syncing Branches into MongoDB...');
      for (const b of BRANCHES) {
        await Branch.findOneAndUpdate(
          { _id: b._id },
          {
            _id: b._id,
            id: b._id,
            tenantId: b.tenantId,
            companyId: b.tenantId,
            code: b.code || `BR-${b._id}`,
            name: b.name,
            city: b.city,
            latitude: b.latitude,
            longitude: b.longitude,
            address: b.address,
            phone: b.phone || '+92 300 0000000',
            operatingHours: b.operatingHours || '08:00 AM - 11:00 PM',
            deliveryRadius: 15,
            deliveryRadiusKm: 15,
            status: 'active'
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      console.log(`✅ ${BRANCHES.length} Branches synced.`);
    }

    // Always ensure each branch has its latest deliveryPolygon, deliveryRadiusKm, and assignedZoneId in MongoDB
    for (const b of diskBranches) {
      const bId = b._id || b.id;
      if (!bId) continue;
      await Branch.findOneAndUpdate(
        { $or: [{ _id: bId }, { id: bId }] },
        {
          $set: {
            deliveryPolygon: b.deliveryPolygon || [],
            deliveryRadiusKm: Number(b.deliveryRadiusKm || b.deliveryRadius || 5),
            deliveryRadius: Number(b.deliveryRadiusKm || b.deliveryRadius || 5),
            assignedZoneId: b.assignedZoneId || null,
            deliveryTiers: b.deliveryTiers || [],
            deliveryStatus: b.deliveryStatus || 'active'
          }
        }
      );
    }

    // 2b. Synchronize Multi-Store Delivery Zones (DeliveryZone collection)
    const zoneCount = await DeliveryZone.countDocuments();
    if (zoneCount < 4) {
      console.log('🔄 Syncing Delivery Zones into MongoDB...');
      const zonesToSeed = loadDiskZones();
      for (const z of zonesToSeed) {
        await DeliveryZone.findOneAndUpdate(
          { zoneId: z.zoneId },
          {
            _id: z._id || z.zoneId,
            zoneId: z.zoneId,
            name: z.name,
            code: z.code,
            description: z.description || '',
            city: z.city || 'Faisalabad',
            area: z.area || '',
            geometry: z.geometry,
            coordinates: z.coordinates || z.geometry?.coordinates,
            color: z.color || '#10b981',
            deliveryCharge: Number(z.deliveryCharge ?? 100),
            minOrderAmount: Number(z.minOrderAmount ?? 500),
            freeDeliveryThreshold: Number(z.freeDeliveryThreshold ?? 2500),
            estimatedDeliveryTime: z.estimatedDeliveryTime || '25-40 mins',
            assignedStoreId: z.assignedStoreId || null,
            isActive: z.isActive !== false,
            status: z.status || 'active'
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      console.log(`✅ Delivery Zones synced into MongoDB.`);
    }

    // 2c. Synchronize Stores into MongoDB (Store collection)
    const storeCount = await Store.countDocuments();
    if (storeCount < 4) {
      console.log('🔄 Syncing Stores into MongoDB...');
      const storesToSeed = loadDiskStores();
      for (const s of storesToSeed) {
        await Store.findOneAndUpdate(
          { storeId: s.storeId },
          {
            _id: s._id || s.storeId,
            storeId: s.storeId,
            tenantId: s.tenantId,
            tenantName: s.tenantName || 'Supermarket',
            name: s.name,
            branchName: s.branchName,
            address: s.address,
            city: s.city || 'Faisalabad',
            latitude: s.latitude,
            longitude: s.longitude,
            location: s.location || {
              type: 'Point',
              coordinates: [s.longitude, s.latitude]
            },
            contactNumber: s.contactNumber || '+92 300 0000000',
            openingHours: s.openingHours || '08:00 AM',
            closingHours: s.closingHours || '11:00 PM',
            storeImage: s.storeImage || '',
            status: s.status || 'active',
            isActive: s.isActive !== false,
            operatingStatus: s.operatingStatus || 'Open',
            manager: s.manager || '',
            deliveryRadiusKm: Number(s.deliveryRadiusKm || 5),
            deliveryPolygon: s.deliveryPolygon || [],
            assignedZoneId: s.assignedZoneId || null
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      console.log(`✅ Stores synced into MongoDB.`);
    }

    // 2d. Synchronize Zone-to-Store Assignments into MongoDB
    const diskAssignments = loadDiskAssignments();
    for (const a of diskAssignments) {
      if (a.zoneId && a.storeId) {
        await ZoneStore.findOneAndUpdate(
          { zoneId: a.zoneId, storeId: a.storeId },
          {
            zoneId: a.zoneId,
            storeId: a.storeId,
            tenantId: a.tenantId || 'tenant-unimart',
            isActive: a.isActive !== false,
            priority: Number(a.priority || 1),
            assignedAt: a.assignedAt || new Date()
          },
          { upsert: true }
        );
      }
    }

    // 3. Synchronize Store Departments with Unique Department IDs
    const categoryCount = await Category.countDocuments();
    if (categoryCount < STORE_DEPARTMENTS.length) {
      console.log('🔄 Syncing Store Departments with unique department IDs into MongoDB...');
      for (const dept of STORE_DEPARTMENTS) {
        await Category.findOneAndUpdate(
          { tenantId: dept.tenantId, departmentId: dept.departmentId },
          {
            id: dept.id,
            departmentId: dept.departmentId,
            departmentCode: dept.departmentCode,
            tenantId: dept.tenantId,
            companyId: dept.companyId,
            tenantName: dept.tenantName,
            slug: dept.slug,
            name: dept.name,
            shortName: dept.shortName,
            icon: dept.icon,
            description: dept.description,
            image: dept.image,
            productCount: dept.productCount,
            discountBadge: dept.discountBadge || '',
            subcategories: dept.subcategories || [],
            featured: Boolean(dept.featured)
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      console.log(`✅ ${STORE_DEPARTMENTS.length} Unique Store Departments synced.`);
    }

    // 4. Synchronize Multi-Tenant Products (Al-Fatah, Chase Up, Chase Value, Unimaart)
    const productCount = await Product.countDocuments();
    if (productCount < ALL_BRANCH_PRODUCTS.length + 15) {
      console.log('🔄 Syncing Multi-Tenant Products into MongoDB...');
      // Sync dedicated branch products
      for (const p of ALL_BRANCH_PRODUCTS) {
        const dept = getDepartmentById(p.departmentId || p.category, p.tenantId);
        await Product.findOneAndUpdate(
          { customId: p.id },
          {
            id: p.id,
            customId: p.customId || p.id,
            name: p.name,
            brand: p.brand || 'Store Brand',
            tenantId: p.tenantId,
            tenantName: p.tenantName || dept?.tenantName || 'Supermarket',
            departmentId: p.departmentId || dept?.departmentId || `dept-${p.category}`,
            departmentCode: p.departmentCode || dept?.departmentCode || 'DEPT-01',
            departmentName: dept?.name || p.categoryLabel || 'Grocery',
            category: p.category,
            categoryId: p.category,
            categoryLabel: p.categoryLabel || dept?.name || 'Grocery',
            price: Number(p.price),
            originalPrice: Number(p.originalPrice || p.price),
            wholesalePrice: Math.round(Number(p.price) * 0.85),
            tierPricing: [{ minQty: 10, discountPercent: 10 }],
            discountPercent: Number(p.discountPercent || 0),
            unit: p.unit || '1 Kg',
            rating: Number(p.rating || 4.8),
            reviewsCount: Number(p.reviewsCount || 100),
            stock: Number(p.stockCount || p.stock || 50),
            stockCount: Number(p.stockCount || p.stock || 50),
            minStock: 15,
            status: 'Active',
            inStock: true,
            isFlashDeal: Boolean(p.isFlashDeal),
            isBestSeller: Boolean(p.isBestSeller),
            image: p.image,
            gallery: [p.image],
            description: p.description,
            nutrition: p.nutrition || {}
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      // Sync FreshMart core products
      for (const p of FRESHMART_PRODUCTS) {
        const dept = getDepartmentById(p.category, 'tenant-freshmart');
        await Product.findOneAndUpdate(
          { customId: p.id },
          {
            id: p.id,
            customId: p.id,
            name: p.name,
            brand: p.brand || 'Farm Fresh',
            tenantId: 'tenant-freshmart',
            tenantName: 'Unimaart',
            departmentId: dept?.departmentId || `dept-um-${p.category}`,
            departmentCode: dept?.departmentCode || 'DEPT-UM-01',
            departmentName: dept?.name || p.categoryLabel || 'Produce',
            category: p.category,
            categoryId: p.category,
            categoryLabel: p.categoryLabel || 'General',
            price: Number(p.price),
            originalPrice: Number(p.originalPrice || p.price),
            discountPercent: Number(p.discountPercent || 0),
            unit: p.unit || '1 Pack',
            stock: Number(p.stockCount || p.stock || 100),
            stockCount: Number(p.stockCount || p.stock || 100),
            image: p.image,
            description: p.description,
            status: 'Active',
            inStock: true,
            nutrition: p.nutrition || {}
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      console.log('✅ Multi-Tenant Products synced successfully.');
    }

    // 5. Seed Tayyab Coca-Cola supplier if not existing
    const cocaSupplier = await Supplier.findOne({
      $or: [{ username: 'tayyab' }, { name: /Tayyab/i }, { username: 'coca_cola' }]
    });
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
      console.log('✅ Coca-Cola partner supplier verified.');
    }

    // 6. Synchronize Admins, Pickup Staff, and Riders collections
    await seedCoreEntities();
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

async function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`🚀 FreshMart Node.js + Express Server running on port ${PORT}`);
    console.log(`📡 API Endpoints available at: http://localhost:${PORT}/api`);
  });

  // Connect to DB and sync in background
  connectDB()
    .then(() => seedInitialDatabase())
    .catch((err) => console.warn('DB connect/seed error:', err.message));

  // Keep node event loop actively alive
  setInterval(() => {}, 1000 * 60 * 60);
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
