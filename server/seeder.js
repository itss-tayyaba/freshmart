import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { Category } from './models/Category.js';
import { Supplier, Promotion, Delivery, Rider } from './models/ExtraModels.js';
import {
  FRESHMART_CATEGORIES,
  FRESHMART_PRODUCTS
} from '../src/data/freshMartData.js';
import {
  ADMIN_SUPPLIERS_DATA,
  ADMIN_PROMOTIONS_DATA,
  ADMIN_DELIVERIES_DATA
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
    await Product.deleteMany();
    await Category.deleteMany();
    await Supplier.deleteMany();
    await Rider.deleteMany();
    await Promotion.deleteMany();
    await Delivery.deleteMany();

    console.log('🧹 Existing data wiped.');

    // 1. Seed Admin & Registered Customers (Hafsa & Aimen) - bcrypt pre-save hash
    await User.create([
      {
        name: 'Super Admin',
        email: 'admin@freshmart.com',
        password: 'adminpassword123',
        role: 'admin'
      },
      {
        name: 'Hafsa',
        email: 'hafsa@gmail.com',
        password: 'password123',
        role: 'customer',
        address: 'House 12, Street 4, Johar Town, Lahore, Pakistan',
        phone: '0300-1234567'
      },
      {
        name: 'Aimen',
        email: 'aimen@gmail.com',
        password: 'password123',
        role: 'customer',
        address: 'Gulberg III, Main Boulevard, Lahore, Pakistan',
        phone: '0321-7654321'
      }
    ]);

    // 2. Seed Categories
    const categoriesToSeed = FRESHMART_CATEGORIES.map((c) => ({
      slug: c.id,
      name: c.name,
      shortName: c.shortName,
      image: c.image,
      productCount: c.itemCount,
      subcategories: c.subcategories || []
    }));
    await Category.insertMany(categoriesToSeed);

    // 3. Seed Products
    const productsToSeed = FRESHMART_PRODUCTS.map((p) => ({
      name: p.name,
      brand: p.brand,
      category: p.category,
      categoryLabel: p.categoryLabel,
      price: p.price,
      originalPrice: p.originalPrice,
      discountPercent: p.discountPercent,
      unit: p.unit,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      stock: p.stockCount || 50,
      minStock: 15,
      status: p.inStock ? 'Active' : 'Out of Stock',
      isFlashDeal: p.isFlashDeal || false,
      image: p.image,
      gallery: p.gallery || [p.image],
      description: p.description,
      nutrition: p.nutrition || {}
    }));
    await Product.insertMany(productsToSeed);

    // 4. Seed Suppliers (Bcrypt pre-save hook hashes password)
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

    // 5. Seed Fleet Riders (Bcrypt pre-save hook hashes password)
    await Rider.create([
      {
        id: 'RDR-101',
        name: 'Rider Ali',
        phone: '0301-1234567',
        vehicleType: '🏍️ Honda 125',
        vehicleNumber: 'LEK-4589',
        zone: 'Lahore Hub',
        status: 'On-Duty',
        username: 'rider',
        password: 'rider123',
        cnic: '35202-1234567-1',
        deliveriesCount: 42,
        rating: 4.9
      }
    ]);

    // 6. Seed Promotions
    await Promotion.insertMany(
      ADMIN_PROMOTIONS_DATA.map((p) => ({
        code: `PROMO-${p.id}`,
        title: p.title,
        discountPercent: 20,
        type: p.category === 'Flash Sales' ? 'Flash Sale' : 'Coupon',
        status: p.status
      }))
    );

    // 7. Seed Deliveries
    await Delivery.insertMany(
      ADMIN_DELIVERIES_DATA.map((d) => ({
        orderId: d.id,
        customerName: d.customer,
        riderName: d.rider,
        riderPhone: d.riderPhone,
        status: d.status,
        eta: d.eta
      }))
    );

    console.log('✅ FreshMart database seeded successfully with hashed credentials!');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
