import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { Category } from './models/Category.js';
import { Supplier, Promotion, Delivery } from './models/ExtraModels.js';
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
    // Clear existing
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Supplier.deleteMany();
    await Promotion.deleteMany();
    await Delivery.deleteMany();

    console.log('🧹 Existing data wiped.');

    // Seed Admin & Registered Customers (Hafsa & Aimen)
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

    // Seed Categories
    const categoriesToSeed = FRESHMART_CATEGORIES.map((c) => ({
      slug: c.id,
      name: c.name,
      shortName: c.shortName,
      image: c.image,
      productCount: c.itemCount,
      subcategories: c.subcategories || []
    }));
    await Category.insertMany(categoriesToSeed);

    // Seed Products
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

    // Seed Suppliers, Promotions, Delivery
    await Supplier.insertMany(
      ADMIN_SUPPLIERS_DATA.map((s) => ({
        supplierId: s.id,
        name: s.name,
        contactPerson: s.contact,
        phone: s.phone,
        email: s.email,
        status: s.status
      }))
    );

    await Promotion.insertMany(
      ADMIN_PROMOTIONS_DATA.map((p) => ({
        code: `PROMO-${p.id}`,
        title: p.title,
        discountPercent: 20,
        type: p.category === 'Flash Sales' ? 'Flash Sale' : 'Coupon',
        status: p.status
      }))
    );

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

    console.log('✅ FreshMart database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
