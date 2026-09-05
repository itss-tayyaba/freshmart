import mongoose from 'mongoose';
import { isDbOnline } from '../config/db.js';
import { Product } from '../models/Product.js';
import { FRESHMART_PRODUCTS } from '../../src/data/freshMartData.js';

// @desc    Fetch all products with filtering, search & pagination
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, search, isFlashDeal, status } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit !== undefined ? Math.max(1, parseInt(req.query.limit, 10) || 20) : 50;
    const skip = (page - 1) * limit;

    if (isDbOnline()) {
      let query = {};
      if (category && category !== 'all') query.category = category;
      if (brand) query.brand = brand;
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }
      if (isFlashDeal === 'true') query.isFlashDeal = true;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { categoryLabel: { $regex: search, $options: 'i' } }
        ];
      }

      const total = await Product.countDocuments(query);
      const totalPages = Math.ceil(total / limit) || 1;

      const products = await Product.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      if (products && products.length > 0) {
        const mappedProducts = products.map((doc) => {
          const obj = doc.toObject ? doc.toObject() : doc;
          return {
            ...obj,
            id: String(obj.customId || obj.id || obj._id)
          };
        });
        return res.json({
          success: true,
          page,
          limit,
          total,
          totalPages,
          count: mappedProducts.length,
          products: mappedProducts
        });
      }
    }

    // In-Memory / Instant Fallback filtering & pagination
    let filtered = [...FRESHMART_PRODUCTS];
    if (category && category !== 'all') filtered = filtered.filter((p) => p.category === category);
    if (brand) filtered = filtered.filter((p) => p.brand === brand);
    if (isFlashDeal === 'true') filtered = filtered.filter((p) => p.isFlashDeal);
    if (minPrice) filtered = filtered.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter((p) => p.price <= Number(maxPrice));
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.brand.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice(skip, skip + limit);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      count: paginated.length,
      products: paginated
    });
  } catch (error) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit !== undefined ? Math.max(1, parseInt(req.query.limit, 10) || 20) : 50;
    const skip = (page - 1) * limit;
    const total = FRESHMART_PRODUCTS.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = FRESHMART_PRODUCTS.slice(skip, skip + limit);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      count: paginated.length,
      products: paginated
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbOnline()) {
      let product = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id);
      }
      if (!product) {
        product = await Product.findOne({ $or: [{ customId: id }, { id: id }] });
      }
      if (product) return res.json({ success: true, product });
    }

    const fallback = FRESHMART_PRODUCTS.find((p) => p.id === req.params.id);
    if (fallback) return res.json({ success: true, product: fallback });
    res.status(404).json({ success: false, message: 'Product not found' });
  } catch (error) {
    const fallback = FRESHMART_PRODUCTS.find((p) => p.id === req.params.id);
    if (fallback) return res.json({ success: true, product: fallback });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product (Admin)
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { id, name, brand, category, categoryLabel, price, originalPrice, stock, unit, image, description } = req.body;
    const productId = id || `prod-${Date.now()}`;

    if (isDbOnline()) {
      const product = new Product({
        customId: productId,
        id: productId,
        name,
        brand: brand || 'Farm Fresh',
        category: category || 'fruits-veg',
        categoryLabel: categoryLabel || 'Fruits & Vegetables',
        price: Number(price),
        originalPrice: Number(originalPrice || price),
        stock: Number(stock || 50),
        unit: unit || '1 Kg',
        image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
        description: description || 'Fresh high-grade grocery product.'
      });
      const created = await product.save();
      return res.status(201).json({ success: true, product: created });
    }

    const newProduct = {
      id: productId,
      name,
      brand: brand || 'Farm Fresh',
      category: category || 'fruits-veg',
      categoryLabel: categoryLabel || 'Fruits & Vegetables',
      price: Number(price),
      originalPrice: Number(originalPrice || price),
      stock: Number(stock || 50),
      unit: unit || '1 Kg',
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      description: description || 'Fresh high-grade grocery product.'
    };
    FRESHMART_PRODUCTS.unshift(newProduct);
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product or product picture (Admin)
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (isDbOnline()) {
      let product = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id);
      }
      if (!product) {
        product = await Product.findOne({ $or: [{ customId: id }, { id: id }, { name: updateData.name }] });
      }

      if (product) {
        Object.assign(product, updateData);
        if (updateData.image) product.image = updateData.image;
        const updated = await product.save();
        return res.json({ success: true, product: updated });
      } else {
        // Upsert if not existing yet in MongoDB
        const newProduct = new Product({
          customId: id,
          id: id,
          name: updateData.name || 'Product',
          brand: updateData.brand || 'Farm Fresh',
          category: updateData.category || 'fruits-veg',
          categoryLabel: updateData.categoryLabel || 'Fruits & Vegetables',
          price: Number(updateData.price || 100),
          originalPrice: Number(updateData.originalPrice || updateData.price || 100),
          stock: Number(updateData.stock || 50),
          unit: updateData.unit || '1 Kg',
          image: updateData.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
          description: updateData.description || 'Fresh high-grade grocery product.'
        });
        const created = await newProduct.save();
        return res.json({ success: true, product: created });
      }
    }

    // Also update in-memory catalog
    const idx = FRESHMART_PRODUCTS.findIndex((p) => p.id === id);
    if (idx !== -1) {
      FRESHMART_PRODUCTS[idx] = { ...FRESHMART_PRODUCTS[idx], ...updateData };
    }
    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product (Admin)
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbOnline()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        await Product.findByIdAndDelete(id);
      }
      await Product.deleteOne({ $or: [{ customId: id }, { id: id }] });
    }
    const idx = FRESHMART_PRODUCTS.findIndex((p) => p.id === id);
    if (idx !== -1) {
      FRESHMART_PRODUCTS.splice(idx, 1);
    }
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
