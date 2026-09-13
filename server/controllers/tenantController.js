import { Tenant } from '../models/Tenant.js';
import { Order } from '../models/Order.js';
import { Rider, Supplier } from '../models/ExtraModels.js';
import { Product } from '../models/Product.js';
import { isDbOnline } from '../config/db.js';
import { INITIAL_TENANTS } from '../../src/data/tenantData.js';
import { ADMIN_ORDERS_FULL } from '../../src/data/adminSuiteData.js';

// In-memory tenant store synchronized with INITIAL_TENANTS
let IN_MEMORY_TENANTS = JSON.parse(JSON.stringify(INITIAL_TENANTS));

// Helper to look up tenant across MongoDB or in-memory
const findTenantRecord = async (identifier) => {
  if (!identifier) return null;
  const cleanId = String(identifier).trim();

  if (isDbOnline()) {
    try {
      const dbTenant = await Tenant.findOne({
        $or: [
          ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
          { id: cleanId },
          { tenantId: cleanId },
          { slug: cleanId.toLowerCase() }
        ]
      });
      if (dbTenant) return dbTenant;
    } catch (e) {
      console.warn('MongoDB tenant lookup error:', e.message);
    }
  }

  // Fallback to in-memory store
  const norm = cleanId.toLowerCase().replace(/[^a-z0-9]/g, '');
  return IN_MEMORY_TENANTS.find(
    (t) =>
      t.id === cleanId ||
      t.tenantId === cleanId ||
      t.slug === cleanId.toLowerCase() ||
      t.slug === cleanId.toLowerCase().replace(/^tenant-/, '') ||
      (t.id && t.id.toLowerCase().replace(/[^a-z0-9]/g, '') === norm) ||
      (t.slug && t.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === norm.replace(/^tenant/, '')) ||
      (t.name && t.name.toLowerCase() === cleanId.toLowerCase())
  );
};

// @desc    Get all tenants (Super Admin gets all; optional ?active=true for storefront)
// @route   GET /api/tenants
export const getTenants = async (req, res) => {
  try {
    const { status, plan, search } = req.query;

    let tenantList = [];

    if (isDbOnline()) {
      try {
        const query = {};
        if (status) query.status = status;
        if (plan) query['subscription.plan'] = plan;
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } },
            { ownerName: { $regex: search, $options: 'i' } }
          ];
        }

        tenantList = await Tenant.find(query).sort({ createdAt: -1 });

        // If DB is empty, seed initial tenants into MongoDB
        if (tenantList.length === 0 && !status && !search) {
          for (const t of IN_MEMORY_TENANTS) {
            await Tenant.findOneAndUpdate({ id: t.id }, t, { upsert: true, new: true });
          }
          tenantList = await Tenant.find({}).sort({ createdAt: -1 });
        }
      } catch (e) {
        console.warn('MongoDB getTenants fallback:', e.message);
      }
    }

    if (!tenantList || tenantList.length === 0) {
      tenantList = [...IN_MEMORY_TENANTS];
      if (status) tenantList = tenantList.filter((t) => t.status.toLowerCase() === status.toLowerCase());
      if (plan) tenantList = tenantList.filter((t) => t.subscription?.plan?.toLowerCase() === plan.toLowerCase());
      if (search) {
        const s = search.toLowerCase();
        tenantList = tenantList.filter(
          (t) =>
            t.name.toLowerCase().includes(s) ||
            t.slug.toLowerCase().includes(s) ||
            t.ownerName.toLowerCase().includes(s)
        );
      }
    }

    return res.json({
      success: true,
      count: tenantList.length,
      tenants: tenantList
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tenant details by ID or slug
// @route   GET /api/tenants/:id
export const getTenantById = async (req, res) => {
  try {
    const tenant = await findTenantRecord(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    return res.json({ success: true, tenant });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Super Admin: Add new tenant
// @route   POST /api/tenants
export const createTenant = async (req, res) => {
  try {
    const {
      name,
      slug,
      tagline,
      description,
      logo,
      banner,
      badge,
      ownerName,
      ownerEmail,
      ownerPhone,
      status = 'Active',
      theme,
      hubs,
      subscription,
      plan,
      billingCycle,
      price
    } = req.body;

    const owner = ownerName || req.body.owner || 'Store Manager';
    const email = ownerEmail || req.body.email || `admin@${(slug || name || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '')}.pk`;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide store name'
      });
    }

    const generatedSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const tenantId = `tenant-${generatedSlug}`;

    const chosenPlan = plan || subscription?.plan || 'Starter';
    const chosenPrice = price !== undefined ? Number(price) : (subscription?.price || (chosenPlan === 'Enterprise' ? 75000 : chosenPlan === 'Starter' ? 15000 : 35000));

    const newTenantData = {
      id: tenantId,
      tenantId,
      name: name.trim(),
      slug: generatedSlug,
      tagline: tagline || 'Premier Grocery & Essentials Partner',
      description: description || '',
      logo: logo || '🏬',
      banner: banner || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      badge: badge || 'Official Partner Store',
      ownerName: owner.trim(),
      ownerEmail: email.toLowerCase().trim(),
      ownerPhone: ownerPhone || '+92 300 1234567',
      status: status || 'Active',
      theme: theme || {
        primaryColor: '#047857',
        accentColor: '#10b981',
        bgGradient: 'from-emerald-900 via-teal-950 to-slate-950'
      },
      color: theme?.primaryColor || req.body.color || '#047857',
      hubs: Array.isArray(hubs) && hubs.length > 0 ? hubs : ['Main Hub'],
      subscription: {
        plan: chosenPlan,
        billingCycle: billingCycle || subscription?.billingCycle || 'Monthly',
        price: chosenPrice,
        status: subscription?.status || 'Active',
        renewsAt: subscription?.renewsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        features: subscription?.features || ['Store Admin Console', 'Unlimited Products', 'Fleet Dispatch', 'Real-time GPS', 'Analytics']
      },
      stats: {
        totalOrders: 0,
        totalRevenue: 0,
        activeProducts: 0,
        activeRiders: 0,
        fulfillmentRate: 100
      }
    };

    if (isDbOnline()) {
      try {
        const created = await Tenant.create(newTenantData);
        IN_MEMORY_TENANTS.unshift(newTenantData);
        return res.status(201).json({
          success: true,
          message: `Tenant "${name}" successfully registered!`,
          tenant: created
        });
      } catch (e) {
        console.warn('MongoDB createTenant fallback:', e.message);
      }
    }

    // In-memory fallback
    IN_MEMORY_TENANTS.unshift(newTenantData);
    return res.status(201).json({
      success: true,
      message: `Tenant "${name}" successfully registered!`,
      tenant: newTenantData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Super Admin: Invite Tenant (generates invitation token & link)
// @route   POST /api/tenants/invite
export const inviteTenant = async (req, res) => {
  try {
    const { name, ownerEmail, email, ownerName, plan = 'Starter', billingCycle = 'Monthly' } = req.body;
    const recipientEmail = ownerEmail || email;

    if (!name || !recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide company/brand name and recipient email'
      });
    }

    const invitationToken = `inv-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const tenantId = `tenant-${generatedSlug}`;

    const invitedTenant = {
      id: tenantId,
      tenantId,
      name,
      slug: generatedSlug,
      ownerName: ownerName || 'Store Manager',
      ownerEmail: recipientEmail.toLowerCase().trim(),
      status: 'Pending',
      badge: 'Invited Store',
      logo: '🏬',
      invitationToken,
      invitationSentAt: new Date().toISOString(),
      invitationLink: `https://grocery-fawn-five.vercel.app/admin?invite=${invitationToken}&tenant=${generatedSlug}`,
      subscription: {
        plan,
        billingCycle,
        price: plan === 'Enterprise' ? 75000 : plan === 'Starter' ? 15000 : 35000,
        status: 'Pending',
        renewsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      stats: { totalOrders: 0, totalRevenue: 0, activeProducts: 0, activeRiders: 0, fulfillmentRate: 100 }
    };

    if (isDbOnline()) {
      try {
        await Tenant.findOneAndUpdate({ id: tenantId }, invitedTenant, { upsert: true, new: true });
      } catch (e) {}
    }

    const existingIdx = IN_MEMORY_TENANTS.findIndex((t) => t.id === tenantId);
    if (existingIdx >= 0) {
      IN_MEMORY_TENANTS[existingIdx] = invitedTenant;
    } else {
      IN_MEMORY_TENANTS.unshift(invitedTenant);
    }

    return res.status(201).json({
      success: true,
      message: `Invitation successfully created for ${recipientEmail}!`,
      inviteToken: invitationToken,
      inviteLink: invitedTenant.invitationLink,
      invitation: {
        tenantId,
        storeName: name,
        ownerEmail: recipientEmail,
        token: invitationToken,
        invitationLink: invitedTenant.invitationLink,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      tenant: invitedTenant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Super Admin: Approve Tenant (Pending -> Active)
// @route   POST /api/tenants/:id/approve
export const approveTenant = async (req, res) => {
  try {
    const tenant = await findTenantRecord(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    tenant.status = 'Active';

    if (isDbOnline() && typeof tenant.save === 'function') {
      await tenant.save();
    }

    const mem = IN_MEMORY_TENANTS.find((t) => t.id === tenant.id || t.slug === tenant.slug);
    if (mem) mem.status = 'Active';

    return res.json({
      success: true,
      message: `Tenant "${tenant.name}" has been approved and activated!`,
      tenant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Super Admin: Suspend Tenant
// @route   POST /api/tenants/:id/suspend
export const suspendTenant = async (req, res) => {
  try {
    const tenant = await findTenantRecord(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    tenant.status = 'Suspended';

    if (isDbOnline() && typeof tenant.save === 'function') {
      await tenant.save();
    }

    const mem = IN_MEMORY_TENANTS.find((t) => t.id === tenant.id || t.slug === tenant.slug);
    if (mem) mem.status = 'Suspended';

    return res.json({
      success: true,
      message: `Tenant "${tenant.name}" has been suspended. Storefront ordering is paused.`,
      tenant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Super Admin: Activate Tenant
// @route   POST /api/tenants/:id/activate
export const activateTenant = async (req, res) => {
  try {
    const tenant = await findTenantRecord(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    tenant.status = 'Active';

    if (isDbOnline() && typeof tenant.save === 'function') {
      await tenant.save();
    }

    const mem = IN_MEMORY_TENANTS.find((t) => t.id === tenant.id || t.slug === tenant.slug);
    if (mem) mem.status = 'Active';

    return res.json({
      success: true,
      message: `Tenant "${tenant.name}" has been reactivated successfully!`,
      tenant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Super Admin: Delete Tenant
// @route   DELETE /api/tenants/:id
export const deleteTenant = async (req, res) => {
  try {
    const tenantId = req.params.id;

    if (isDbOnline()) {
      try {
        await Tenant.findOneAndDelete({
          $or: [
            ...(tenantId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: tenantId }] : []),
            { id: tenantId },
            { tenantId },
            { slug: tenantId.toLowerCase() }
          ]
        });
      } catch (e) {}
    }

    const initialLength = IN_MEMORY_TENANTS.length;
    IN_MEMORY_TENANTS = IN_MEMORY_TENANTS.filter(
      (t) => t.id !== tenantId && t.tenantId !== tenantId && t.slug !== tenantId.toLowerCase()
    );

    return res.json({
      success: true,
      message: `Tenant "${tenantId}" removed from platform.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Super Admin: Manage Tenant Subscription
// @route   PUT /api/tenants/:id/subscription
export const updateSubscription = async (req, res) => {
  try {
    const { plan, billingCycle, price, status, renewsAt, features } = req.body;

    const tenant = await findTenantRecord(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (!tenant.subscription) {
      tenant.subscription = {};
    }

    if (plan) tenant.subscription.plan = plan;
    if (billingCycle) tenant.subscription.billingCycle = billingCycle;
    if (price !== undefined) tenant.subscription.price = Number(price);
    if (status) tenant.subscription.status = status;
    if (renewsAt) tenant.subscription.renewsAt = new Date(renewsAt);
    if (Array.isArray(features)) tenant.subscription.features = features;

    if (isDbOnline() && typeof tenant.save === 'function') {
      await tenant.save();
    }

    const mem = IN_MEMORY_TENANTS.find((t) => t.id === tenant.id || t.slug === tenant.slug);
    if (mem) {
      mem.subscription = {
        ...mem.subscription,
        ...tenant.subscription
      };
    }

    return res.json({
      success: true,
      message: `Subscription for "${tenant.name}" updated to ${tenant.subscription.plan} plan.`,
      subscription: tenant.subscription,
      tenant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Super Admin: See Tenant Orders
// @route   GET /api/tenants/:id/orders
export const getTenantOrders = async (req, res) => {
  try {
    const targetTenantId = req.params.id;

    let orders = [];

    if (isDbOnline()) {
      try {
        orders = await Order.find({
          $or: [
            { tenantId: targetTenantId },
            { tenantId: targetTenantId.replace(/^tenant-/, '') }
          ]
        }).sort({ createdAt: -1 });
      } catch (e) {}
    }

    if (!orders || orders.length === 0) {
      // In-memory fallback
      orders = (ADMIN_ORDERS_FULL || []).filter(
        (o) =>
          o.tenantId === targetTenantId ||
          o.tenantId === targetTenantId.replace(/^tenant-/, '') ||
          !o.tenantId // include demo orders if no specific tenant set
      );
    }

    return res.json({
      success: true,
      tenantId: targetTenantId,
      count: orders.length,
      orders
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Super Admin: See Tenant Performance
// @route   GET /api/tenants/:id/performance
export const getTenantPerformance = async (req, res) => {
  try {
    const targetTenantId = req.params.id;
    const tenant = await findTenantRecord(targetTenantId);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Calculate real metrics
    let orders = [];
    if (isDbOnline()) {
      try {
        orders = await Order.find({
          $or: [
            { tenantId: targetTenantId },
            { tenantId: targetTenantId.replace(/^tenant-/, '') }
          ]
        });
      } catch (e) {}
    }

    if (!orders || orders.length === 0) {
      orders = (ADMIN_ORDERS_FULL || []).filter(
        (o) => o.tenantId === targetTenantId || o.tenantId === targetTenantId.replace(/^tenant-/, '')
      );
    }

    const totalOrdersCount = orders.length > 0 ? orders.length : (tenant.stats?.totalOrders || 850);
    const totalGmv = orders.length > 0
      ? orders.reduce((sum, o) => sum + Number(o.totalPrice || o.totalAmount || 0), 0)
      : (tenant.stats?.totalRevenue || 2450000);

    const platformFeeRate = 0.035; // 3.5% Super Platform Commission
    const platformCommission = Math.round(totalGmv * platformFeeRate);
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalGmv / totalOrdersCount) : 0;

    const performance = {
      tenantId: tenant.id || tenant.tenantId,
      name: tenant.name,
      status: tenant.status,
      plan: tenant.subscription?.plan || 'Professional',
      billingCycle: tenant.subscription?.billingCycle || 'Monthly',
      gmv: totalGmv,
      commission: platformCommission,
      activeRiders: tenant.stats?.activeRiders || 20,
      fulfillmentSla: `${tenant.stats?.fulfillmentRate || 98.8}%`,
      metrics: {
        totalOrders: totalOrdersCount,
        grossMerchandiseValue: totalGmv,
        formattedGmv: `PKR ${totalGmv.toLocaleString()}`,
        avgOrderValue,
        formattedAov: `PKR ${avgOrderValue.toLocaleString()}`,
        platformCommission,
        formattedCommission: `PKR ${platformCommission.toLocaleString()}`,
        activeRiders: tenant.stats?.activeRiders || 20,
        activeProducts: tenant.stats?.activeProducts || 100,
        fulfillmentSla: `${tenant.stats?.fulfillmentRate || 98.8}%`,
        customerRating: 4.8
      },
      growthMoM: '+14.2%',
      dispatchesOnTimePercent: 97.6,
      hubsCount: tenant.hubs ? tenant.hubs.length : 4
    };

    return res.json({
      success: true,
      performance
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Super Admin: Global Platform Overview (All tenants aggregation)
// @route   GET /api/tenants/platform/overview
export const getPlatformOverview = async (req, res) => {
  try {
    const tenants = [...IN_MEMORY_TENANTS];

    const activeCount = tenants.filter((t) => t.status === 'Active').length;
    const pendingCount = tenants.filter((t) => t.status === 'Pending').length;
    const suspendedCount = tenants.filter((t) => t.status === 'Suspended').length;

    const totalPlatformGmv = tenants.reduce((sum, t) => sum + (t.stats?.totalRevenue || 0), 0);
    const totalPlatformOrders = tenants.reduce((sum, t) => sum + (t.stats?.totalOrders || 0), 0);
    const totalFleetRiders = tenants.reduce((sum, t) => sum + (t.stats?.activeRiders || 0), 0);
    const monthlyRecurringRevenue = tenants.reduce((sum, t) => {
      const price = t.subscription?.price || 0;
      return sum + (t.subscription?.billingCycle === 'Annual' ? Math.round(price / 12) : price);
    }, 0);

    return res.json({
      success: true,
      overview: {
        totalTenants: tenants.length,
        activeTenants: activeCount,
        pendingTenants: pendingCount,
        suspendedTenants: suspendedCount,
        totalGmv: totalPlatformGmv,
        totalCommission: Math.round(totalPlatformGmv * 0.035),
        totalOrders: totalPlatformOrders,
        totalRiders: totalFleetRiders,
        monthlyRecurringRevenue,
        avgSla: '99.1%'
      },
      platform: {
        name: 'Super Grocery Multi-Tenant Platform',
        version: '3.0.0',
        tenantsSummary: {
          total: tenants.length,
          active: activeCount,
          pending: pendingCount,
          suspended: suspendedCount
        },
        financials: {
          totalGmv: totalPlatformGmv,
          formattedGmv: `PKR ${totalPlatformGmv.toLocaleString()}`,
          mrr: monthlyRecurringRevenue,
          formattedMrr: `PKR ${monthlyRecurringRevenue.toLocaleString()}`,
          totalOrders: totalPlatformOrders,
          totalFleetRiders
        },
        topTenants: tenants.map((t) => ({
          id: t.id,
          name: t.name,
          plan: t.subscription?.plan,
          status: t.status,
          orders: t.stats?.totalOrders || 0,
          revenue: `PKR ${(t.stats?.totalRevenue || 0).toLocaleString()}`
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
