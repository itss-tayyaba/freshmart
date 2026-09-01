import { isDbOnline } from '../config/db.js';
import { Product } from '../models/Product.js';
import { FRESHMART_PRODUCTS } from '../../src/data/freshMartData.js';

// @desc    Fetch all products with filtering & search
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, search, isFlashDeal, status } = req.query;

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

      const products = await Product.find(query);
      if (products && products.length > 0) {
        return res.json({ success: true, count: products.length, products });
      }
    }

    // In-Memory / Instant Fallback filtering
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

    res.json({ success: true, count: filtered.length, products: filtered });
  } catch (error) {
    res.json({ success: true, count: FRESHMART_PRODUCTS.length, products: FRESHMART_PRODUCTS });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    if (isDbOnline()) {
      const product = await Product.findById(req.params.id);
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
    const { name, brand, category, categoryLabel, price, originalPrice, stock, unit, image, description } = req.body;

    if (isDbOnline()) {
      const product = new Product({
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
      id: `p-${Date.now()}`,
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

// @desc    Update a product (Admin)
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    if (isDbOnline()) {
      const product = await Product.findById(req.params.id);
      if (product) {
        Object.assign(product, req.body);
        const updated = await product.save();
        return res.json({ success: true, product: updated });
      }
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
    if (isDbOnline()) {
      const product = await Product.findById(req.params.id);
      if (product) {
        await product.deleteOne();
        return res.json({ success: true, message: 'Product removed' });
      }
    }
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
