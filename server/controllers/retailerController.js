import { Tenant } from '../models/Tenant.js';
import { Company } from '../models/Company.js';
import { isDbOnline } from '../config/db.js';
import { PLATFORM_RETAILERS, resolveRetailerId, getRetailerDetails } from '../utils/retailerHelper.js';

// @desc    Get all retailers (Super Admin & Public)
// @route   GET /api/admin/retailers
export const getRetailers = async (req, res) => {
  try {
    let dbTenants = [];
    if (isDbOnline()) {
      try {
        dbTenants = await Tenant.find({}).lean();
      } catch (err) {
        console.warn('Tenant DB fetch warning:', err.message);
      }
    }

    // Merge registered tenants with PLATFORM_RETAILERS ensuring all 4 core retailers exist
    const mergedMap = new Map();

    PLATFORM_RETAILERS.forEach((r) => {
      mergedMap.set(r.id, {
        id: r.id,
        tenantId: r.id,
        name: r.name,
        displayName: r.displayName,
        slug: r.slug,
        logo: r.logo,
        banner: r.banner,
        tagline: r.tagline,
        themeColor: r.themeColor,
        ownerName: r.ownerName,
        ownerEmail: r.ownerEmail,
        status: r.status,
        isActive: r.status === 'Active'
      });
    });

    dbTenants.forEach((t) => {
      const canonicalId = resolveRetailerId(t.id || t.tenantId);
      const existing = mergedMap.get(canonicalId);
      if (existing) {
        mergedMap.set(canonicalId, {
          ...existing,
          ...t,
          id: canonicalId,
          name: existing.name, // Keep clean name
          displayName: t.displayName || t.name || existing.displayName,
          status: t.status || existing.status,
          isActive: String(t.status || existing.status).toLowerCase() === 'active'
        });
      } else {
        mergedMap.set(t.id, {
          ...t,
          id: t.id,
          isActive: String(t.status).toLowerCase() === 'active'
        });
      }
    });

    const retailers = Array.from(mergedMap.values());
    return res.json({
      success: true,
      count: retailers.length,
      retailers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a retailer
// @route   POST /api/admin/retailers
export const createRetailer = async (req, res) => {
  try {
    const { name, slug, tagline, ownerName, ownerEmail, ownerPhone, themeColor, logo, banner } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Retailer name is required.' });
    }

    const retailerId = `tenant-${slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const newRetailerData = {
      id: retailerId,
      tenantId: retailerId,
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      tagline: tagline || 'Premier Grocery Partner',
      ownerName: ownerName || 'Retailer Admin',
      ownerEmail: ownerEmail || `admin@${slug || 'retailer'}.pk`,
      ownerPhone: ownerPhone || '+92 300 0000000',
      status: 'Active',
      theme: { primaryColor: themeColor || '#059669' },
      logo: logo || '🏬',
      banner: banner || ''
    };

    if (isDbOnline()) {
      await Tenant.findOneAndUpdate({ id: retailerId }, newRetailerData, { upsert: true, new: true });
    }

    return res.status(201).json({
      success: true,
      message: 'Retailer created successfully.',
      retailer: newRetailerData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update retailer
// @route   PUT /api/admin/retailers/:id
export const updateRetailer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const canonicalId = resolveRetailerId(id);

    if (isDbOnline()) {
      await Tenant.findOneAndUpdate({ $or: [{ id }, { id: canonicalId }, { tenantId: id }] }, updates, { new: true });
    }

    return res.json({
      success: true,
      message: 'Retailer updated successfully.',
      id: canonicalId,
      updates
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle retailer status
// @route   PATCH /api/admin/retailers/:id/status
export const toggleRetailerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const canonicalId = resolveRetailerId(id);

    const newStatus = status || 'Active';

    if (isDbOnline()) {
      await Tenant.findOneAndUpdate(
        { $or: [{ id }, { id: canonicalId }, { tenantId: id }] },
        { status: newStatus },
        { new: true }
      );
    }

    return res.json({
      success: true,
      message: `Retailer status updated to ${newStatus}.`,
      id: canonicalId,
      status: newStatus
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
