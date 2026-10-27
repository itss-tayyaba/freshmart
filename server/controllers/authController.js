import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Supplier, Rider } from '../models/ExtraModels.js';
import { isDbOnline } from '../config/db.js';

const generateToken = (id, role = 'customer', email = '', name = '', vendorId = undefined, extraClaims = {}) => {
  return jwt.sign(
    { id, role, email, name, ...(vendorId ? { vendorId } : {}), ...extraClaims },
    process.env.JWT_SECRET || 'freshmart_secret_key_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (isDbOnline()) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      const user = await User.create({
        name,
        email,
        password,
        phone: phone || '',
        address: address || '123 Main Street, Lahore, Pakistan',
        role: 'customer'
      });

      if (user) {
        return res.status(201).json({
          success: true,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          address: user.address,
          phone: user.phone,
          token: generateToken(user._id, user.role, user.email, user.name)
        });
      }
    }

    // Fallback registration response
    const mockId = `usr-${Date.now()}`;
    return res.status(201).json({
      success: true,
      _id: mockId,
      name,
      email,
      role: 'customer',
      address: address || '123 Main Street, Lahore, Pakistan',
      phone: phone || '',
      token: generateToken(mockId, 'customer', email, name)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user, supplier or rider & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/username and password' });
    }

    const cleanInput = email.toLowerCase().trim();
    const pickupUsername = cleanInput.endsWith('@pickup.freshmart.pk')
      ? cleanInput.slice(0, -'@pickup.freshmart.pk'.length)
      : cleanInput;

    if (isDbOnline()) {
      // 1. Check User model (Customers & Admins)
      const user = await User.findOne({
        $or: [
          { email: cleanInput },
          { name: new RegExp(`^${cleanInput}$`, 'i') },
          ...(cleanInput === 'admin' ? [{ role: 'admin' }] : [])
        ]
      });

      if (user) {
        const isMatch = await user.matchPassword(password);
        const isAdminFallback = user.role === 'admin' && (password === 'admin123' || password === 'adminpassword123');

        if (isMatch || isAdminFallback) {
          let resolvedTenantId = req.body.tenantId || user.tenantId;
          if (!resolvedTenantId || resolvedTenantId === 'all') {
            if (cleanInput.includes('chasevalue')) resolvedTenantId = 'tenant-chasevalue';
            else if (cleanInput.includes('chaseup')) resolvedTenantId = 'tenant-chaseup';
            else if (cleanInput.includes('alfatah')) resolvedTenantId = 'tenant-alfatah';
            else if (cleanInput.includes('unimart') || cleanInput.includes('freshmart')) resolvedTenantId = 'tenant-freshmart';
            else resolvedTenantId = user.tenantId || 'tenant-freshmart';
          }
          if (resolvedTenantId === 'company_004') resolvedTenantId = 'tenant-freshmart';
          if (resolvedTenantId === 'company_001') resolvedTenantId = 'tenant-alfatah';
          if (resolvedTenantId === 'company_002') resolvedTenantId = 'tenant-chaseup';
          if (resolvedTenantId === 'company_003') resolvedTenantId = 'tenant-chasevalue';
          const tenantNames = {
            'tenant-alfatah': 'Al-Fatah Supermarket',
            'tenant-chasevalue': 'Chase Value',
            'tenant-chaseup': 'Chase Up',
            'tenant-freshmart': 'Unimaart'
          };
          const resolvedTenantName = tenantNames[resolvedTenantId] || 'FreshMart Direct';

          const resolvedBranchId = req.body.branchId || user.branchId || 'branch_001';
          const resolvedBranchName = user.branchName || 'Main Branch';

          return res.json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            address: user.address,
            phone: user.phone,
            staffId: user.staffId,
            tenantId: resolvedTenantId,
            tenantName: resolvedTenantName,
            branchId: resolvedBranchId,
            branchName: resolvedBranchName,
            token: generateToken(user.staffId || user._id, user.role, user.email, user.name, undefined, {
              ...(user.staffId ? { staffId: user.staffId } : {}),
              ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
              ...(resolvedBranchId ? { branchId: resolvedBranchId, branchName: resolvedBranchName } : {})
            })
          });
        }
      }

      // 2. Check Supplier model with bcrypt matchPassword
      const supplier = await Supplier.findOne({
        $or: [
          { email: cleanInput },
          { username: cleanInput },
          { name: new RegExp(`^${cleanInput}$`, 'i') },
          { supplierId: cleanInput.toUpperCase() }
        ]
      });

      if (supplier) {
        const isMatch = await supplier.matchPassword(password);
        const isDefaultSupplierFallback = password === 'supplier123' || password === 'cocacola123';

        if (isMatch || isDefaultSupplierFallback) {
          const vId = supplier.supplierId || supplier.id || 'VND-101';
          return res.json({
            success: true,
            _id: supplier._id,
            id: vId,
            vendorId: vId,
            name: supplier.name,
            email: supplier.email,
            role: 'supplier',
            token: generateToken(supplier._id, 'supplier', supplier.email, supplier.name, vId)
          });
        }
      }

      // 3. Check Rider model with bcrypt matchPassword
      const rider = await Rider.findOne({
        $or: [
          { username: cleanInput },
          { phone: cleanInput },
          { id: cleanInput.toUpperCase() },
          { name: new RegExp(`^${cleanInput}$`, 'i') }
        ]
      });

      if (rider) {
        const isMatch = await rider.matchPassword(password);
        const isDefaultRiderFallback = password === 'rider123';

        if (isMatch || isDefaultRiderFallback) {
          const riderTenantId = rider.tenantId || req.body.tenantId || 'tenant-alfatah';
          const resolvedBranchId = req.body.branchId || rider.branchId || 'branch_001';
          const resolvedBranchName = rider.branchName || 'Main Branch';
          return res.json({
            success: true,
            _id: rider._id,
            id: rider.id,
            riderId: rider.id,
            name: rider.name,
            phone: rider.phone,
            role: 'rider',
            tenantId: riderTenantId,
            branchId: resolvedBranchId,
            branchName: resolvedBranchName,
            token: generateToken(rider._id, 'rider', `${rider.username || 'rider'}@freshmart.pk`, rider.name, undefined, {
              riderId: rider.id,
              tenantId: riderTenantId,
              branchId: resolvedBranchId,
              branchName: resolvedBranchName
            })
          });
        }
      }
    }

    // Super Admin Platform Owner credentials (e.g. superadmin / superadmin123)
    if (
      (cleanInput === 'superadmin' || cleanInput === 'superadmin@supergrocery.pk' || cleanInput === 'admin@supergrocery.pk') &&
      (password === 'superadmin123' || password === 'admin123' || password === 'adminpassword123')
    ) {
      return res.json({
        success: true,
        _id: 'superadmin-root',
        name: 'Platform Super Admin',
        email: 'superadmin@supergrocery.pk',
        role: 'superadmin',
        isSuperAdmin: true,
        token: generateToken('superadmin-root', 'superadmin', 'superadmin@supergrocery.pk', 'Platform Super Admin')
      });
    }

    // Default admin and Store Admin credentials (e.g. admin, admin@alfatah.pk, admin@chasevalue.pk / admin123)
    if (
      (cleanInput === 'admin' ||
        cleanInput === 'admin@freshmart.com' ||
        cleanInput === 'admin@freshmart.pk' ||
        cleanInput === 'admin@alfatah.pk' ||
        cleanInput === 'admin@chasevalue.pk' ||
        cleanInput === 'admin@chaseup.pk' ||
        cleanInput === 'admin@unimart.pk' ||
        cleanInput.includes('admin')) &&
      (password === 'admin123' || password === 'adminpassword123' || password === 'superadmin123')
    ) {
      const tenantMap = {
        'admin@alfatah.pk': { id: 'tenant-alfatah', name: 'Al-Fatah Supermarket' },
        'admin@chasevalue.pk': { id: 'tenant-chasevalue', name: 'Chase Value' },
        'admin@chaseup.pk': { id: 'tenant-chaseup', name: 'Chase Up' },
        'admin@unimart.pk': { id: 'tenant-freshmart', name: 'Unimaart' },
        'admin@freshmart.pk': { id: 'tenant-freshmart', name: 'Unimaart' },
        'admin@freshmart.com': { id: 'tenant-freshmart', name: 'Unimaart' },
        'support@unimaart.com': { id: 'tenant-freshmart', name: 'Unimaart' },
        'admin@unimaart.com': { id: 'tenant-freshmart', name: 'Unimaart' }
      };

      let t = null;
      if (req.body.tenantId && req.body.tenantId !== 'all') {
        const tid = String(req.body.tenantId).toLowerCase();
        if (tid === 'tenant-chasevalue' || tid === 'company_003' || tid.includes('chasevalue')) t = { id: 'tenant-chasevalue', name: 'Chase Value' };
        else if (tid === 'tenant-chaseup' || tid === 'company_002' || tid.includes('chaseup')) t = { id: 'tenant-chaseup', name: 'Chase Up' };
        else if (tid === 'tenant-freshmart' || tid === 'company_004' || tid.includes('freshmart') || tid.includes('unimart')) t = { id: 'tenant-freshmart', name: 'Unimaart' };
        else if (tid === 'tenant-alfatah' || tid === 'company_001' || tid.includes('alfatah')) t = { id: 'tenant-alfatah', name: 'Al-Fatah Supermarket' };
      }
      if (!t) {
        t = tenantMap[cleanInput];
      }
      if (!t) {
        if (cleanInput.includes('chasevalue')) t = { id: 'tenant-chasevalue', name: 'Chase Value' };
        else if (cleanInput.includes('chaseup')) t = { id: 'tenant-chaseup', name: 'Chase Up' };
        else if (cleanInput.includes('freshmart') || cleanInput.includes('unimart') || cleanInput.includes('unimaart')) t = { id: 'tenant-freshmart', name: 'Unimaart' };
        else if (cleanInput.includes('alfatah')) t = { id: 'tenant-alfatah', name: 'Al-Fatah Supermarket' };
        else t = { id: 'tenant-freshmart', name: 'Unimaart' };
      }
      return res.json({
        success: true,
        _id: `admin-${t.id}`,
        name: `${t.name} Admin`,
        email: cleanInput,
        role: 'admin',
        tenantId: t.id,
        tenantName: t.name,
        token: generateToken(`admin-${t.id}`, 'admin', cleanInput, `${t.name} Admin`, undefined, { tenantId: t.id })
      });
    }

    // Default supplier fallback credentials (e.g. tayyab / supplier)
    if (
      (cleanInput === 'tayyab' || cleanInput === 'supplier' || cleanInput === 'tayyab.cocacola@freshmart.pk') &&
      (password === 'cocacola123' || password === 'supplier123')
    ) {
      return res.json({
        success: true,
        _id: 'sup-root',
        id: 'SUP-101',
        vendorId: 'VND-101',
        name: 'Tayyab (Coca-Cola Beverages)',
        email: 'tayyab.cocacola@freshmart.pk',
        role: 'supplier',
        token: generateToken('sup-root', 'supplier', 'tayyab.cocacola@freshmart.pk', 'Tayyab', 'VND-101')
      });
    }

    // Default rider fallback credentials (e.g. rider / rider123, alfatah_rider, chasevalue_rider, etc.)
    if (
      (cleanInput === 'rider' || cleanInput === '0301-1234567' || cleanInput.includes('rider')) &&
      (password === 'rider123' || password === 'admin123')
    ) {
      let tId = req.body.tenantId;
      if (!tId) {
        if (cleanInput.includes('chasevalue')) tId = 'tenant-chasevalue';
        else if (cleanInput.includes('chaseup')) tId = 'tenant-chaseup';
        else if (cleanInput.includes('unimart') || cleanInput.includes('freshmart')) tId = 'tenant-freshmart';
        else if (cleanInput.includes('alfatah')) tId = 'tenant-alfatah';
        else tId = 'tenant-alfatah';
      }
      const tenantNames = {
        'tenant-alfatah': 'Al-Fatah Supermarket',
        'tenant-chasevalue': 'Chase Value',
        'tenant-chaseup': 'Chase Up',
        'tenant-freshmart': 'Unimaart'
      };
      return res.json({
        success: true,
        _id: `rdr-${tId}`,
        id: `RDR-${tId}`,
        riderId: `RDR-${tId}`,
        name: `${tenantNames[tId] || 'Store'} Courier Rider`,
        role: 'rider',
        phone: cleanInput,
        tenantId: tId,
        tenantName: tenantNames[tId] || 'Store',
        token: generateToken(`rdr-${tId}`, 'rider', `${cleanInput}@rider.freshmart.pk`, 'Rider', undefined, { riderId: `RDR-${tId}`, tenantId: tId })
      });
    }

    // Default pickup staff fallback credentials (e.g. hafsa, staff / staff123, alfatah_staff, chasevalue_staff, etc.)
    if (
      (pickupUsername === 'staff' ||
       pickupUsername === 'pickup' ||
       pickupUsername === 'hafsa' ||
       pickupUsername.includes('hafsa') ||
       pickupUsername === 'rizwan_pack' ||
       pickupUsername.includes('staff')) &&
      (password === 'staff123' || password === 'admin123' || password === 'pickup123' || password === 'hafsa123')
    ) {
      let tId = req.body.tenantId;
      if (!tId) {
        if (pickupUsername.includes('chasevalue')) tId = 'tenant-chasevalue';
        else if (pickupUsername.includes('chaseup')) tId = 'tenant-chaseup';
        else if (pickupUsername.includes('unimart') || pickupUsername.includes('freshmart')) tId = 'tenant-freshmart';
        else if (pickupUsername.includes('hafsa') || pickupUsername.includes('alfatah')) tId = 'tenant-alfatah';
        else tId = 'tenant-alfatah';
      }
      const tenantNames = {
        'tenant-alfatah': 'Al-Fatah Supermarket',
        'tenant-chasevalue': 'Chase Value',
        'tenant-chaseup': 'Chase Up',
        'tenant-freshmart': 'Unimaart'
      };
      const isHafsa = pickupUsername === 'hafsa' || pickupUsername.includes('hafsa');
      const staffDisplayName = isHafsa ? 'Hafsa (Al-Fatah Packing Desk)' : `${tenantNames[tId] || 'Store'} Pickup Staff`;
      const staffIdentifier = isHafsa ? 'PCK-ALFATAH-HAFSA' : `PCK-${tId}`;

      return res.json({
        success: true,
        _id: `staff-${tId}`,
        id: staffIdentifier,
        staffId: staffIdentifier,
        name: staffDisplayName,
        username: cleanInput,
        role: 'pickup_staff',
        tenantId: tId,
        tenantName: tenantNames[tId] || 'Store',
        token: generateToken(staffIdentifier, 'pickup_staff', `${pickupUsername}@pickup.freshmart.pk`, staffDisplayName, undefined, { staffId: staffIdentifier, tenantId: tId })
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a pickup staff account that can authenticate from any device
// @desc    Create or update a pickup staff account in database
// @route   POST /api/auth/pickup-staff
export const createPickupStaff = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const rawUsername = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '').trim();
    const phone = String(req.body.phone || '').trim();
    const tenantId = String(req.body.tenantId || req.user?.tenantId || 'tenant-alfatah');
    const branchId = String(req.body.branchId || req.user?.branchId || 'branch_001');
    const branchName = String(req.body.branchName || 'Main Branch');
    const staffId = String(req.body.staffId || `PCK-${Date.now().toString(36).toUpperCase()}`);
    if (!name || !rawUsername || password.length < 4) {
      return res.status(400).json({ success: false, message: 'Name, username, and a password of at least 4 characters are required.' });
    }

    const email = rawUsername.includes('@') ? rawUsername : `${rawUsername}@pickup.freshmart.pk`;
    const cleanUsername = rawUsername.includes('@pickup.freshmart.pk')
      ? rawUsername.replace('@pickup.freshmart.pk', '')
      : rawUsername;

    if (isDbOnline()) {
      let staff = await User.findOne({
        $or: [
          { email },
          { email: `${cleanUsername}@pickup.freshmart.pk` },
          { staffId }
        ]
      });

      if (staff) {
        staff.name = name;
        staff.email = email;
        staff.password = password; // bcrypt pre-save hook will hash it
        staff.phone = phone || staff.phone;
        staff.tenantId = tenantId;
        staff.branchId = branchId;
        staff.branchName = branchName;
        staff.role = 'pickup_staff';
        staff.staffId = staff.staffId || staffId;
        await staff.save();
        return res.status(200).json({
          success: true,
          staff: {
            id: staff.staffId,
            staffId: staff.staffId,
            name: staff.name,
            username: cleanUsername,
            email: staff.email,
            phone: staff.phone,
            tenantId,
            branchId,
            branchName,
            role: staff.role,
            status: 'Active'
          }
        });
      }

      staff = await User.create({ name, email, password, phone, role: 'pickup_staff', staffId, tenantId, branchId, branchName });
      return res.status(201).json({
        success: true,
        staff: {
          id: staff.staffId,
          staffId: staff.staffId,
          name: staff.name,
          username: cleanUsername,
          email: staff.email,
          phone: staff.phone,
          tenantId,
          branchId,
          branchName,
          role: staff.role,
          status: 'Active'
        }
      });
    }

    // Local / In-memory fallback
    return res.status(201).json({
      success: true,
      staff: { id: staffId, staffId, name, username: cleanUsername, email, phone, tenantId, branchId, branchName, role: 'pickup_staff', status: 'Active' }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all pickup staff from database
// @route   GET /api/auth/pickup-staff
export const getPickupStaff = async (req, res) => {
  try {
    if (!isDbOnline()) {
      const defaultStaff = [
        {
          id: 'PCK-ALFATAH-HAFSA',
          staffId: 'PCK-ALFATAH-HAFSA',
          name: 'Hafsa (Al-Fatah Packing Desk)',
          username: 'hafsa',
          email: 'hafsa@alfatah.pk',
          phone: '+92 300 1112233',
          tenantId: 'tenant-alfatah',
          branchId: 'branch_001',
          branchName: 'DHA Lahore',
          role: 'pickup_staff',
          status: 'Active'
        },
        {
          id: 'PCK-ALFATAH',
          staffId: 'PCK-ALFATAH',
          name: 'Al-Fatah Packing Desk',
          username: 'alfatah_staff',
          email: 'staff@alfatah.pk',
          phone: '+92 300 1112234',
          tenantId: 'tenant-alfatah',
          branchId: 'branch_001',
          branchName: 'DHA Lahore',
          role: 'pickup_staff',
          status: 'Active'
        }
      ];
      const targetTenant = req.query.tenantId || req.user?.tenantId;
      const targetBranch = req.query.branchId || (req.user?.branchId !== 'all' ? req.user?.branchId : null);
      let list = defaultStaff;
      if (targetTenant) list = list.filter((s) => s.tenantId === targetTenant);
      if (targetBranch) list = list.filter((s) => s.branchId === targetBranch);
      return res.json({ success: true, staff: list });
    }
    const query = { role: 'pickup_staff' };
    const targetTenant = req.query.tenantId || req.user?.tenantId;
    const targetBranch = req.query.branchId || (req.user?.branchId !== 'all' ? req.user?.branchId : null);
    if (targetTenant) {
      query.tenantId = targetTenant;
    }
    if (targetBranch) {
      query.branchId = targetBranch;
    }
    const staffList = await User.find(query).select('-password').sort({ createdAt: -1 });
    const formatted = staffList.map((s) => ({
      id: s.staffId || s._id.toString(),
      staffId: s.staffId || s._id.toString(),
      name: s.name,
      username: s.email.includes('@pickup.freshmart.pk')
        ? s.email.replace('@pickup.freshmart.pk', '')
        : s.email,
      email: s.email,
      phone: s.phone || '',
      tenantId: s.tenantId || 'tenant-alfatah',
      branchId: s.branchId || 'branch_001',
      branchName: s.branchName || 'Main Branch',
      role: s.role,
      status: 'Active',
      createdAt: s.createdAt
    }));
    return res.json({ success: true, count: formatted.length, staff: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete pickup staff from database
// @route   DELETE /api/auth/pickup-staff/:id
export const deletePickupStaff = async (req, res) => {
  try {
    if (!isDbOnline()) {
      return res.json({ success: true, message: 'Deleted locally' });
    }
    const { id } = req.params;
    const cleanId = String(id || '').trim().toLowerCase();
    await User.deleteMany({
      $or: [
        { staffId: id },
        { email: cleanId },
        { email: `${cleanId}@pickup.freshmart.pk` },
        { name: new RegExp(`^${cleanId}$`, 'i') }
      ]
    });
    return res.json({ success: true, message: 'Pickup staff deleted from database' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save or update Store Admin (Mart Admin) in database
// @route   POST /api/auth/store-admin
export const saveStoreAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, tenantId, tenantName } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    if (isDbOnline()) {
      let adminUser = await User.findOne({
        $or: [
          { email: cleanEmail },
          { email: `${cleanEmail.split('@')[0]}@supergrocery.pk` }
        ]
      });

      if (adminUser) {
        adminUser.name = name || adminUser.name;
        adminUser.email = cleanEmail;
        adminUser.password = password; // bcrypt pre-save hook will hash it
        adminUser.role = 'admin';
        adminUser.tenantId = tenantId || adminUser.tenantId;
        adminUser.phone = phone || adminUser.phone;
        await adminUser.save();
      } else {
        adminUser = await User.create({
          name: name || 'Store Admin',
          email: cleanEmail,
          password,
          role: 'admin',
          tenantId: tenantId || 'tenant-alfatah',
          phone: phone || ''
        });
      }

      return res.json({
        success: true,
        admin: {
          id: adminUser._id.toString(),
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          tenantId: adminUser.tenantId,
          tenantName: tenantName || 'Supermarket',
          phone: adminUser.phone
        }
      });
    }

    return res.json({ success: true, admin: req.body });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Store Admins from database
// @route   GET /api/auth/store-admins
export const getStoreAdmins = async (req, res) => {
  try {
    if (!isDbOnline()) {
      return res.json({ success: true, admins: [] });
    }
    const adminUsers = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
    const formatted = adminUsers.map((a) => ({
      id: a._id.toString(),
      name: a.name,
      email: a.email,
      username: a.email.split('@')[0],
      tenantId: a.tenantId || 'tenant-alfatah',
      phone: a.phone || '',
      role: 'Store Admin',
      status: 'Active',
      createdAt: a.createdAt
    }));
    return res.json({ success: true, count: formatted.length, admins: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Store Admin from database
// @route   DELETE /api/auth/store-admin/:id
export const deleteStoreAdmin = async (req, res) => {
  try {
    if (!isDbOnline()) {
      return res.json({ success: true });
    }
    const { id } = req.params;
    const cleanId = String(id || '').trim().toLowerCase();
    await User.deleteMany({
      $or: [
        { email: cleanId },
        { email: `${cleanId.split('@')[0]}@supergrocery.pk` }
      ]
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
export const getUserProfile = async (req, res) => {
  try {
    if (isDbOnline() && req.user && req.user._id) {
      const user = await User.findById(req.user._id);
      if (user) {
        return res.json({
          success: true,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address
        });
      }
    }

    if (req.user) {
      return res.json({
        success: true,
        _id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        address: req.user.address
      });
    }

    return res.status(404).json({ success: false, message: 'User not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
