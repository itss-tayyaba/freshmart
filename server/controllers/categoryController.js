import { isDbOnline } from '../config/db.js';
import { Category } from '../models/Category.js';
import { FRESHMART_CATEGORIES } from '../../src/data/freshMartData.js';

// @desc    Get all categories
// @route   GET /api/categories
export const getCategories = async (req, res) => {
  try {
    if (isDbOnline()) {
      const categories = await Category.find({});
      if (categories && categories.length > 0) {
        return res.json({ success: true, count: categories.length, categories });
      }
    }
    res.json({ success: true, count: FRESHMART_CATEGORIES.length, categories: FRESHMART_CATEGORIES });
  } catch (error) {
    res.json({ success: true, count: FRESHMART_CATEGORIES.length, categories: FRESHMART_CATEGORIES });
  }
};

// @desc    Create a category (Admin)
// @route   POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const { name, image, subcategories, productCount } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (isDbOnline()) {
      const category = new Category({
        slug,
        name,
        shortName: name,
        image: image || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80',
        productCount: Number(productCount || 0),
        subcategories: subcategories || []
      });
      const created = await category.save();
      return res.status(201).json({ success: true, category: created });
    }

    const newCat = {
      id: slug,
      name,
      shortName: name,
      image: image || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80',
      itemCount: Number(productCount || 15),
      productCount: Number(productCount || 15),
      subcategories: subcategories || []
    };
    FRESHMART_CATEGORIES.push(newCat);
    res.status(201).json({ success: true, category: newCat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a category (Admin)
// @route   PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const { name, image, productCount, subcategories } = req.body;
    if (isDbOnline()) {
      const category = await Category.findOne({ $or: [{ _id: req.params.id }, { slug: req.params.id }] });
      if (category) {
        if (name) category.name = name;
        if (name) category.shortName = name;
        if (image) category.image = image;
        if (productCount !== undefined) category.productCount = Number(productCount);
        if (subcategories) category.subcategories = subcategories;
        const updated = await category.save();
        return res.json({ success: true, category: updated });
      }
    }
    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a category (Admin)
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    if (isDbOnline()) {
      const category = await Category.findOne({ $or: [{ _id: req.params.id }, { slug: req.params.id }] });
      if (category) {
        await category.deleteOne();
        return res.json({ success: true, message: 'Category removed' });
      }
    }
    res.json({ success: true, message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
