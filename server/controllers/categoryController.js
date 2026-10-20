import mongoose from 'mongoose';
import { isDbOnline } from '../config/db.js';
import { Category } from '../models/Category.js';
import { FRESHMART_CATEGORIES } from '../../src/data/freshMartData.js';
import {
  STORE_DEPARTMENTS,
  getDepartmentsByTenant,
  getDepartmentById as lookupDept
} from '../../src/data/departmentData.js';
import { resolveTenantId, isSameTenant } from '../../src/data/companyHierarchyData.js';

// @desc    Get all categories / store departments (Tenant Scoped & Highly Resilient)
// @route   GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const rawTenantId =
      req.query.tenantId ||
      req.headers['x-tenant-id'] ||
      req.tenantId ||
      req.user?.tenantId;

    const canonicalTenantId = rawTenantId ? resolveTenantId(rawTenantId) : null;
    const { featured } = req.query;

    if (isDbOnline()) {
      let query = {};
      if (rawTenantId && rawTenantId !== 'all') {
        query.$or = [
          { tenantId: rawTenantId },
          ...(canonicalTenantId ? [{ tenantId: canonicalTenantId }, { companyId: canonicalTenantId }] : [])
        ];
      }
      if (featured === 'true') {
        query.featured = true;
      }

      const dbCategories = await Category.find(query).sort({ productCount: -1, createdAt: 1 });
      if (dbCategories && dbCategories.length > 0) {
        const mapped = dbCategories.map((doc) => {
          const obj = doc.toObject ? doc.toObject() : doc;
          return {
            ...obj,
            id: obj.id || obj.slug || String(obj._id),
            departmentId: obj.departmentId || `dept-${obj.slug}`
          };
        });
        return res.json({
          success: true,
          count: mapped.length,
          tenantId: rawTenantId || 'all',
          departments: mapped,
          categories: mapped
        });
      }
    }

    // In-memory fallback: return scoped store departments
    let departments = rawTenantId ? getDepartmentsByTenant(rawTenantId) : [...STORE_DEPARTMENTS];
    if (featured === 'true') {
      departments = departments.filter((d) => d.featured);
    }

    // If no tenant specified and no departments found, fallback to legacy FRESHMART_CATEGORIES
    const finalResult =
      departments.length > 0
        ? departments
        : FRESHMART_CATEGORIES.map((c) => ({
            ...c,
            departmentId: `dept-um-${c.id}`,
            departmentCode: `DEPT-UM-${c.id.slice(0, 3).toUpperCase()}`,
            tenantId: 'tenant-freshmart'
          }));

    return res.json({
      success: true,
      count: finalResult.length,
      tenantId: rawTenantId || 'all',
      departments: finalResult,
      categories: finalResult
    });
  } catch (error) {
    const fallback = getDepartmentsByTenant(req.query.tenantId) || FRESHMART_CATEGORIES;
    return res.json({
      success: true,
      count: fallback.length,
      departments: fallback,
      categories: fallback,
      fallback: true
    });
  }
};

// @desc    Get single category or department by ID / Slug
// @route   GET /api/categories/:id
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const rawTenantId = req.query.tenantId || req.headers['x-tenant-id'];

    if (isDbOnline()) {
      let query = {
        $or: [
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
          { departmentId: id },
          { id: id },
          { slug: id }
        ]
      };
      if (rawTenantId && rawTenantId !== 'all') {
        const canonical = resolveTenantId(rawTenantId);
        query.tenantId = { $in: [rawTenantId, canonical] };
      }

      const cat = await Category.findOne(query);
      if (cat) {
        return res.json({ success: true, department: cat, category: cat });
      }
    }

    const memoryDept = lookupDept(id, rawTenantId);
    if (memoryDept) {
      return res.json({ success: true, department: memoryDept, category: memoryDept });
    }

    res.status(404).json({ success: false, message: `Department/Category '${id}' not found` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a category or department (Admin)
// @route   POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const {
      name,
      image,
      subcategories,
      productCount,
      discountBadge,
      departmentId,
      departmentCode,
      tenantId,
      tenantName,
      description,
      icon,
      featured
    } = req.body;

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const storeTenantId = tenantId || 'tenant-freshmart';
    const deptId = departmentId || `dept-${storeTenantId.slice(-4)}-${baseSlug}`;
    const uniqueSlug = `${storeTenantId}-${baseSlug}`;

    const newCategoryData = {
      id: uniqueSlug,
      departmentId: deptId,
      departmentCode: departmentCode || `DEPT-${Math.floor(100 + Math.random() * 900)}`,
      tenantId: storeTenantId,
      tenantName: tenantName || 'Store',
      slug: baseSlug,
      name,
      shortName: name,
      icon: icon || '🛒',
      description: description || `${name} department for ${tenantName || 'Store'}`,
      image: image || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80',
      productCount: Number(productCount || 0),
      discountBadge: discountBadge || '',
      subcategories: subcategories || [],
      featured: Boolean(featured)
    };

    if (isDbOnline()) {
      const created = await Category.findOneAndUpdate(
        { tenantId: storeTenantId, $or: [{ departmentId: deptId }, { slug: baseSlug }] },
        newCategoryData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(201).json({ success: true, department: created, category: created });
    }

    STORE_DEPARTMENTS.unshift(newCategoryData);
    FRESHMART_CATEGORIES.unshift(newCategoryData);

    return res.status(201).json({ success: true, department: newCategoryData, category: newCategoryData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a category or department (Admin)
// @route   PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isDbOnline()) {
      const category = await Category.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
          { departmentId: id },
          { id: id },
          { slug: id }
        ]
      });

      if (category) {
        if (updates.name) {
          category.name = updates.name;
          category.shortName = updates.name;
        }
        if (updates.image) category.image = updates.image;
        if (updates.icon) category.icon = updates.icon;
        if (updates.description) category.description = updates.description;
        if (updates.productCount !== undefined) category.productCount = Number(updates.productCount);
        if (updates.subcategories) category.subcategories = updates.subcategories;
        if (updates.discountBadge !== undefined) category.discountBadge = updates.discountBadge;
        if (updates.departmentCode) category.departmentCode = updates.departmentCode;
        if (updates.featured !== undefined) category.featured = Boolean(updates.featured);

        const updated = await category.save();
        return res.json({ success: true, department: updated, category: updated });
      }
    }

    // In-memory update
    const idx = STORE_DEPARTMENTS.findIndex(
      (d) => d.departmentId === id || d.id === id || d.slug === id
    );
    if (idx !== -1) {
      STORE_DEPARTMENTS[idx] = { ...STORE_DEPARTMENTS[idx], ...updates };
    }

    return res.json({ success: true, message: 'Department updated successfully', updates });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a category or department (Admin)
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbOnline()) {
      await Category.deleteOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
          { departmentId: id },
          { id: id },
          { slug: id }
        ]
      });
    }

    const idx = STORE_DEPARTMENTS.findIndex(
      (d) => d.departmentId === id || d.id === id || d.slug === id
    );
    if (idx !== -1) {
      STORE_DEPARTMENTS.splice(idx, 1);
    }

    return res.json({ success: true, message: 'Department removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
