import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { isDbOnline } from '../config/db.js';
import { Product } from '../models/Product.js';
import { ALL_BRANCH_PRODUCTS } from '../../src/data/branchCatalogData.js';
import { resolveTenantId, isSameTenant } from '../../src/data/companyHierarchyData.js';
import { getDepartmentById } from '../../src/data/departmentData.js';

const PRODUCTS_FILE_PATH = path.resolve(process.cwd(), 'server/data/products_db.json');

export const loadDiskProducts = () => {
  try {
    if (fs.existsSync(PRODUCTS_FILE_PATH)) {
      const data = fs.readFileSync(PRODUCTS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

export const saveDiskProduct = (product) => {
  try {
    if (!product) return;
    const plain = product.toObject ? product.toObject() : { ...product };
    const pId = String(plain.id || plain.customId || plain._id || '').toLowerCase().trim();
    if (!pId) return;
    const list = loadDiskProducts();
    const filtered = list.filter((p) => {
      const existingId = String(p.id || p.customId || p._id || '').toLowerCase().trim();
      return existingId !== pId;
    });
    filtered.unshift(plain);
    fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');

    // Keep MASTER_IN_MEMORY_CATALOG synchronized
    const memIdx = MASTER_IN_MEMORY_CATALOG.findIndex((m) => {
      const mId = String(m.id || m.customId || m._id || '').toLowerCase().trim();
      return mId === pId;
    });
    if (memIdx >= 0) {
      MASTER_IN_MEMORY_CATALOG[memIdx] = plain;
    } else {
      MASTER_IN_MEMORY_CATALOG.unshift(plain);
    }
  } catch (e) {}
};

export const removeDiskProduct = (productId) => {
  try {
    const pId = String(productId || '').toLowerCase().trim();
    if (!pId) return;
    const list = loadDiskProducts();
    const filtered = list.filter((p) => {
      const existingId = String(p.id || p.customId || p._id || '').toLowerCase().trim();
      return existingId !== pId;
    });
    fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');

    const memIdx = MASTER_IN_MEMORY_CATALOG.findIndex((m) => {
      const mId = String(m.id || m.customId || m._id || '').toLowerCase().trim();
      return mId === pId;
    });
    if (memIdx >= 0) {
      MASTER_IN_MEMORY_CATALOG.splice(memIdx, 1);
    }
  } catch (e) {}
};

// Composite multi-tenant master catalog seeded with only few items (5 per brand) + disk-saved products
const MASTER_IN_MEMORY_CATALOG = [...ALL_BRANCH_PRODUCTS];

// Load any disk-persisted products on initialization
try {
  const diskProducts = loadDiskProducts();
  if (diskProducts.length > 0) {
    diskProducts.forEach((dp) => {
      const dpKey = String(dp.id || dp.customId || dp._id || '').toLowerCase().trim();
      const exists = MASTER_IN_MEMORY_CATALOG.some(
        (m) => String(m.id || m.customId || m._id || '').toLowerCase().trim() === dpKey
      );
      if (!exists) {
        MASTER_IN_MEMORY_CATALOG.unshift(dp);
      }
    });
  }
} catch (e) {}

// Helper to resolve department info for a product
const enrichDepartmentInfo = (item) => {
  if (item.departmentId && item.departmentCode) return item;
  const dept = getDepartmentById(item.departmentId || item.category, item.tenantId);
  return {
    ...item,
    departmentId: item.departmentId || dept?.departmentId || `dept-${item.category}`,
    departmentCode: item.departmentCode || dept?.departmentCode || 'DEPT-GEN',
    departmentName: item.departmentName || dept?.name || item.categoryLabel || 'General'
  };
};

// @desc    Fetch all products with multi-tenant filtering, department scoping, search & pagination
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    const rawTenantId =
      req.query.tenantId ||
      req.headers['x-tenant-id'] ||
      req.tenantId ||
      req.user?.tenantId;

    const {
      category,
      departmentId,
      brand,
      minPrice,
      maxPrice,
      search,
      isFlashDeal,
      status
    } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit !== undefined ? Math.max(1, parseInt(req.query.limit, 10) || 20) : 50;
    const skip = (page - 1) * limit;

    if (isDbOnline()) {
      let query = {};

      if (rawTenantId && rawTenantId !== 'all') {
        const canonical = resolveTenantId(rawTenantId);
        query.$or = [
          { tenantId: rawTenantId },
          ...(canonical ? [{ tenantId: canonical }, { companyId: canonical }] : [])
        ];
      }

      if (departmentId && departmentId !== 'all') {
        query.departmentId = departmentId;
      }

      if (category && category !== 'all') {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { category: category },
            { categoryId: category },
            { departmentId: category }
          ]
        });
      }

      if (brand) query.brand = brand;

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      if (isFlashDeal === 'true') query.isFlashDeal = true;
      if (status) query.status = status;

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { name: searchRegex },
            { brand: searchRegex },
            { categoryLabel: searchRegex },
            { description: searchRegex }
          ]
        });
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
          return enrichDepartmentInfo({
            ...obj,
            id: String(obj.customId || obj.id || obj._id)
          });
        });

        const diskItems = loadDiskProducts().filter((p) => {
          if (rawTenantId && rawTenantId !== 'all') {
            return isSameTenant(p.tenantId, rawTenantId) || (!p.tenantId && rawTenantId === 'tenant-freshmart');
          }
          return true;
        });
        const mappedIds = new Set(mappedProducts.map((p) => String(p.id || p.customId || p._id).toLowerCase().trim()));
        diskItems.forEach((dp) => {
          const dpKey = String(dp.id || dp.customId || dp._id || '').toLowerCase().trim();
          if (!mappedIds.has(dpKey)) {
            mappedProducts.unshift(enrichDepartmentInfo(dp));
            mappedIds.add(dpKey);
          }
        });

        return res.json({
          success: true,
          page,
          limit,
          total: mappedProducts.length,
          totalPages: Math.ceil(mappedProducts.length / limit) || 1,
          count: mappedProducts.length,
          tenantId: rawTenantId || 'all',
          products: mappedProducts
        });
      }
    }

    // In-Memory / Instant Fallback strictly filtered by tenant & department
    let filtered = [...MASTER_IN_MEMORY_CATALOG];

    if (rawTenantId && rawTenantId !== 'all') {
      filtered = filtered.filter(
        (p) => isSameTenant(p.tenantId, rawTenantId) || (!p.tenantId && rawTenantId === 'tenant-freshmart')
      );
    }

    if (departmentId && departmentId !== 'all') {
      filtered = filtered.filter(
        (p) => p.departmentId === departmentId || p.category === departmentId
      );
    }

    if (category && category !== 'all') {
      filtered = filtered.filter(
        (p) => p.category === category || p.categoryId === category || p.departmentId === category
      );
    }

    if (brand) filtered = filtered.filter((p) => p.brand === brand);
    if (isFlashDeal === 'true') filtered = filtered.filter((p) => p.isFlashDeal);
    if (minPrice) filtered = filtered.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter((p) => p.price <= Number(maxPrice));

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice(skip, skip + limit).map(enrichDepartmentInfo);

    return res.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      count: paginated.length,
      tenantId: rawTenantId || 'all',
      products: paginated
    });
  } catch (error) {
    const fallback = MASTER_IN_MEMORY_CATALOG.slice(0, 50).map(enrichDepartmentInfo);
    return res.json({
      success: true,
      page: 1,
      limit: 50,
      total: fallback.length,
      totalPages: 1,
      count: fallback.length,
      products: fallback
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const rawTenantId = req.query.tenantId || req.headers['x-tenant-id'];

    if (isDbOnline()) {
      let query = {
        $or: [
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
          { customId: id },
          { id: id }
        ]
      };
      if (rawTenantId && rawTenantId !== 'all') {
        const canonical = resolveTenantId(rawTenantId);
        query.tenantId = { $in: [rawTenantId, canonical] };
      }

      const product = await Product.findOne(query);
      if (product) {
        const obj = product.toObject ? product.toObject() : product;
        return res.json({ success: true, product: enrichDepartmentInfo(obj) });
      }
    }

    const fallback = MASTER_IN_MEMORY_CATALOG.find((p) => p.id === id || p.customId === id);
    if (fallback) {
      return res.json({ success: true, product: enrichDepartmentInfo(fallback) });
    }

    return res.status(404).json({ success: false, message: `Product '${id}' not found` });
  } catch (error) {
    const fallback = MASTER_IN_MEMORY_CATALOG.find((p) => p.id === req.params.id);
    if (fallback) return res.json({ success: true, product: enrichDepartmentInfo(fallback) });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product (Admin)
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const {
      id,
      name,
      brand,
      category,
      categoryId,
      categoryLabel,
      departmentId,
      departmentCode,
      departmentName,
      tenantId,
      tenantName,
      branchId,
      price,
      originalPrice,
      wholesalePrice,
      tierPricing,
      discountPercent,
      stock,
      unit,
      image,
      gallery,
      description,
      nutrition,
      isFlashDeal,
      isBestSeller,
      status
    } = req.body;

    const productId = id || `prod-${Date.now()}`;
    const priceNum = Number(price) || 0;
    const discountNum = Math.max(0, Number(discountPercent !== undefined ? discountPercent : 0));
    const origPriceNum = Number(
      originalPrice !== undefined && Number(originalPrice) >= priceNum
        ? originalPrice
        : discountNum > 0
        ? Math.round(priceNum / (1 - discountNum / 100))
        : priceNum
    );

    const storeTenantId = tenantId || 'tenant-freshmart';
    const deptInfo = getDepartmentById(departmentId || category, storeTenantId);

    const newProdPayload = {
      customId: productId,
      id: productId,
      name,
      brand: brand || 'Farm Fresh',
      category: category || 'fruits-veg',
      categoryId: categoryId || category || 'fruits-veg',
      categoryLabel: categoryLabel || deptInfo?.name || 'Produce',
      departmentId: departmentId || deptInfo?.departmentId || `dept-${category || 'gen'}`,
      departmentCode: departmentCode || deptInfo?.departmentCode || 'DEPT-GEN',
      departmentName: departmentName || deptInfo?.name || categoryLabel || 'General',
      tenantId: storeTenantId,
      tenantName: tenantName || deptInfo?.tenantName || 'FreshMart Direct',
      branchId: branchId || 'branch_001',
      price: priceNum,
      originalPrice: origPriceNum,
      wholesalePrice: Number(wholesalePrice || Math.round(priceNum * 0.85)),
      tierPricing: Array.isArray(tierPricing) ? tierPricing : [{ minQty: 10, discountPercent: 10 }],
      discountPercent: discountNum,
      stock: Number(stock !== undefined ? stock : 50),
      stockCount: Number(stock !== undefined ? stock : 50),
      minStock: 15,
      unit: unit || '1 Kg',
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      gallery: Array.isArray(gallery) ? gallery : [image],
      description: description || 'Fresh high-grade grocery product.',
      nutrition: nutrition || {},
      isFlashDeal: Boolean(isFlashDeal),
      isBestSeller: Boolean(isBestSeller),
      status: status || (Number(stock) > 0 ? 'Active' : 'Out of Stock'),
      inStock: Number(stock) > 0
    };

    if (isDbOnline()) {
      const product = new Product(newProdPayload);
      const created = await product.save();
      saveDiskProduct(created);
      return res.status(201).json({ success: true, product: created });
    }

    saveDiskProduct(newProdPayload);
    return res.status(201).json({ success: true, product: newProdPayload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product (Admin)
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
        if (updateData.name !== undefined) product.name = updateData.name;
        if (updateData.description !== undefined) product.description = updateData.description;
        if (updateData.price !== undefined) product.price = Number(updateData.price);
        if (updateData.originalPrice !== undefined) product.originalPrice = Number(updateData.originalPrice);
        if (updateData.wholesalePrice !== undefined) product.wholesalePrice = Number(updateData.wholesalePrice);
        if (updateData.discountPercent !== undefined) product.discountPercent = Number(updateData.discountPercent);
        if (updateData.stock !== undefined) {
          product.stock = Number(updateData.stock);
          product.stockCount = product.stock;
          product.inStock = product.stock > 0;
        }
        if (updateData.unit !== undefined) product.unit = updateData.unit;
        if (updateData.category !== undefined) product.category = updateData.category;
        if (updateData.categoryLabel !== undefined) product.categoryLabel = updateData.categoryLabel;
        if (updateData.departmentId !== undefined) product.departmentId = updateData.departmentId;
        if (updateData.departmentCode !== undefined) product.departmentCode = updateData.departmentCode;
        if (updateData.departmentName !== undefined) product.departmentName = updateData.departmentName;
        if (updateData.brand !== undefined) product.brand = updateData.brand;
        if (updateData.image) product.image = updateData.image;
        if (updateData.gallery) product.gallery = updateData.gallery;
        if (updateData.nutrition) product.nutrition = updateData.nutrition;
        if (updateData.isFlashDeal !== undefined) product.isFlashDeal = Boolean(updateData.isFlashDeal);
        if (updateData.isBestSeller !== undefined) product.isBestSeller = Boolean(updateData.isBestSeller);
        if (updateData.status !== undefined) product.status = updateData.status;

        const updated = await product.save();
        saveDiskProduct(updated);
        return res.json({ success: true, product: updated });
      }
    }

    // In-memory catalog update & disk persistence
    const idx = MASTER_IN_MEMORY_CATALOG.findIndex((p) => p.id === id || p.customId === id);
    if (idx !== -1) {
      MASTER_IN_MEMORY_CATALOG[idx] = { ...MASTER_IN_MEMORY_CATALOG[idx], ...updateData };
      saveDiskProduct(MASTER_IN_MEMORY_CATALOG[idx]);
      return res.json({ success: true, message: 'Product updated', product: MASTER_IN_MEMORY_CATALOG[idx] });
    }

    return res.json({ success: true, message: 'Product updated', product: updateData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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

    removeDiskProduct(id);
    return res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
