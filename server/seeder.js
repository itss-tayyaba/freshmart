import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { Category } from './models/Category.js';
import { Company } from './models/Company.js';
import { Branch } from './models/Branch.js';
import { Supplier, Promotion, Delivery, Rider } from './models/ExtraModels.js';
import { STORE_DEPARTMENTS, getDepartmentById } from '../src/data/departmentData.js';
import { ALL_BRANCH_PRODUCTS } from '../src/data/branchCatalogData.js';
import { FRESHMART_PRODUCTS } from '../src/data/freshMartData.js';
import { COMPANIES, BRANCHES } from '../src/data/companyHierarchyData.js';
import {
  ADMIN_SUPPLIERS_DATA,
  ADMIN_PROMOTIONS_DATA
} from '../src/data/adminSuiteData.js';

dotenv.config();

const seedDatabase = async () => {
  const isConnected = await connectDB();
  if (!isConnected) {
    console.log('ℹ️ Seeder finished in memory mode.');
    process.exit(0);
  }

  try {
    // Clear existing collections
    await User.deleteMany();
    await Company.deleteMany();
    await Branch.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Supplier.deleteMany();
    await Rider.deleteMany();
    await Promotion.deleteMany();
    await Delivery.deleteMany();

    console.log('🧹 Existing collections wiped cleanly.');

    // 1. Seed Platform Super Admin
    await User.create([
      {
        name: 'Super Admin',
        email: 'admin@freshmart.com',
        password: 'adminpassword123',
        role: 'admin'
      }
    ]);

    // 2. Seed Supermarket Companies (Tenants)
    await Company.insertMany(
      COMPANIES.map((c) => ({
        _id: c._id,
        tenantId: c.tenantId,
        name: c.name,
        slug: c.slug,
        logo: c.logo || '',
        banner: c.banner || '',
        status: c.status || 'active',
        tagline: c.tagline || '',
        themeColor: c.themeColor || '#047857'
      }))
    );
    console.log(`🏬 Seeded ${COMPANIES.length} Supermarket Companies (Al-Fatah, Chase Up, CaseValue, Unimaart).`);

    // 3. Seed Branches per Company
    await Branch.insertMany(
      BRANCHES.map((b) => ({
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
        status: 'active'
      }))
    );
    console.log(`📍 Seeded ${BRANCHES.length} Branches across Pakistani cities.`);

    // 4. Seed Multi-Tenant Store Departments with Unique Department IDs
    await Category.insertMany(
      STORE_DEPARTMENTS.map((dept) => ({
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
      }))
    );
    console.log(`🏷️ Seeded ${STORE_DEPARTMENTS.length} Unique Store Departments.`);

    // 5. Seed Multi-Tenant Products with Unique IDs, Department IDs, and Relative Info
    const seenProductIds = new Set();
    const compositeProducts = [];

    // First add dedicated branch products
    for (const p of ALL_BRANCH_PRODUCTS) {
      if (seenProductIds.has(p.id)) continue;
      seenProductIds.add(p.id);

      const dept = getDepartmentById(p.departmentId || p.category, p.tenantId);
      compositeProducts.push({
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
      });
    }

    // Next add FreshMart catalog products
    for (const p of FRESHMART_PRODUCTS) {
      if (seenProductIds.has(p.id)) continue;
      seenProductIds.add(p.id);

      const dept = getDepartmentById(p.category, 'tenant-freshmart');
      compositeProducts.push({
        id: p.id,
        customId: p.customId || p.id,
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
        wholesalePrice: Math.round(Number(p.price) * 0.85),
        tierPricing: [{ minQty: 10, discountPercent: 10 }],
        discountPercent: Number(p.discountPercent || 0),
        unit: p.unit || '1 Kg',
        rating: Number(p.rating || 4.8),
        reviewsCount: Number(p.reviewsCount || 50),
        stock: Number(p.stockCount || p.stock || 50),
        stockCount: Number(p.stockCount || p.stock || 50),
        minStock: 15,
        status: p.inStock ? 'Active' : 'Out of Stock',
        inStock: p.inStock !== false,
        isFlashDeal: Boolean(p.isFlashDeal),
        isBestSeller: Boolean(p.isBestSeller),
        image: p.image,
        gallery: p.gallery || [p.image],
        description: p.description,
        nutrition: p.nutrition || {}
      });
    }

    await Product.insertMany(compositeProducts);
    console.log(`📦 Seeded ${compositeProducts.length} Products with Unique IDs & Department Mapping.`);

    // 6. Seed Suppliers
    await Supplier.create(
      ADMIN_SUPPLIERS_DATA.map((s) => ({
        id: s.id || 'SUP-101',
        supplierId: s.id || 'SUP-101',
        name: s.name,
        contact: s.contact,
        contactPerson: s.contact,
        phone: s.phone,
        email: s.email,
        category: s.category || 'Beverages, Juices & Soft Drinks',
        username: s.username || 'tayyab',
        password: s.password || 'cocacola123',
        status: s.status || 'Active'
      }))
    );

    // 7. Seed Promotions
    await Promotion.insertMany(
      ADMIN_PROMOTIONS_DATA.map((p) => ({
        code: `PROMO-${p.id}`,
        title: p.title,
        discountPercent: 20,
        type: p.category === 'Flash Sales' ? 'Flash Sale' : 'Coupon',
        status: p.status
      }))
    );

    console.log('✅ FreshMart database seeded successfully with complete multi-tenant department & product architecture!');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
