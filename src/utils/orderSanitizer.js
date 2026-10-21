import { isSameTenant } from '../data/companyHierarchyData.js';

export const sanitizeOrder = (ord) => {
  if (!ord) return ord;
  const idStr = String(ord.id || ord.orderId || ord._id || '').toLowerCase();
  const addrStr = `${ord.address || ''} ${ord.city || ''} ${ord.shippingAddress?.address || ''} ${ord.shippingAddress?.city || ''}`.toLowerCase();
  const items = ord.items || ord.rawItems || ord.orderItems || [];
  const isFsd = addrStr.includes('peoples colony') || addrStr.includes('faisalabad') || addrStr.includes('fsd');

  // 1. Detect if order belongs strictly to Al-Fatah
  const isExplicitAlfatah =
    idStr.includes('701') ||
    idStr.startsWith('ord-701') ||
    idStr.startsWith('#ord-701') ||
    idStr.startsWith('#af') ||
    idStr.startsWith('af-') ||
    isSameTenant(ord.tenantId, 'tenant-alfatah') ||
    isSameTenant(ord.tenantId, 'company_001') ||
    (ord.tenantName && String(ord.tenantName).toLowerCase().includes('fatah'));

  if (isExplicitAlfatah) {
    const fixedAddr = (addrStr.includes('gulberg iii, lahore') || addrStr.includes('main boulevard, gulberg') || !ord.address)
      ? 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad'
      : (ord.address || 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad');
    const fixedCity = fixedAddr.toLowerCase().includes('faisalabad') ? 'Faisalabad' : (ord.city || 'Faisalabad');

    return {
      ...ord,
      id: ord.id || ord.orderId || 'ORD-701',
      orderId: ord.orderId || ord.id || 'ORD-701',
      tenantId: 'tenant-alfatah',
      tenantName: 'Al-Fatah Supermarket',
      branchId: ord.branchId || (isFsd ? 'branch_af_fsd' : 'branch_001'),
      branchName: ord.branchName || (isFsd ? 'D-Ground Flagship Hub' : 'Gulberg Mall'),
      address: fixedAddr,
      city: fixedCity,
      shippingAddress: typeof ord.shippingAddress === 'object' && ord.shippingAddress ? {
        ...ord.shippingAddress,
        address: fixedAddr,
        city: fixedCity
      } : { address: fixedAddr, city: fixedCity },
      status: ord.status || 'Pending'
    };
  }

  // 2. Detect if order belongs strictly to Unimaart
  const isExplicitUnimaart =
    idStr.includes('fm83459') ||
    idStr.includes('83459') ||
    idStr.startsWith('#fm') ||
    idStr.startsWith('fm-') ||
    isSameTenant(ord.tenantId, 'tenant-freshmart') ||
    isSameTenant(ord.tenantId, 'company_004') ||
    (ord.tenantName && (String(ord.tenantName).toLowerCase().includes('unimaart') || String(ord.tenantName).toLowerCase().includes('unimart') || String(ord.tenantName).toLowerCase().includes('freshmart')));

  if (isExplicitUnimaart) {
    return {
      ...ord,
      id: ord.id || ord.orderId || '#FM83459',
      orderId: ord.orderId || ord.id || '#FM83459',
      tenantId: 'tenant-freshmart',
      tenantName: 'Unimaart (Market Store)',
      branchId: ord.branchId || 'branch_um_fsd',
      branchName: ord.branchName || 'Peoples Colony Dark Store',
      status: ord.status || 'Pending'
    };
  }

  // 3. Detect Chase Value
  if (isSameTenant(ord.tenantId, 'tenant-chasevalue') || isSameTenant(ord.tenantId, 'company_003')) {
    return {
      ...ord,
      tenantId: 'tenant-chasevalue',
      tenantName: 'Chase Value',
      branchId: ord.branchId || 'branch_cv_fsd',
      branchName: ord.branchName || 'Wholesale Express Hub',
      status: ord.status || 'Pending'
    };
  }

  // 4. Detect Chase Up
  if (isSameTenant(ord.tenantId, 'tenant-chaseup') || isSameTenant(ord.tenantId, 'company_002')) {
    return {
      ...ord,
      tenantId: 'tenant-chaseup',
      tenantName: 'Chase Up',
      branchId: ord.branchId || 'branch_004',
      branchName: ord.branchName || 'Clifton Main Branch (Karachi)',
      status: ord.status || 'Pending'
    };
  }

  // Normalize generic addresses if needed
  if (addrStr.includes('gulberg iii, lahore') || addrStr.includes('main boulevard, gulberg')) {
    const fixedAddr = 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad';
    const fixedCity = 'Faisalabad';
    return {
      ...ord,
      address: fixedAddr,
      city: fixedCity,
      shippingAddress: typeof ord.shippingAddress === 'object' && ord.shippingAddress ? {
        ...ord.shippingAddress,
        address: fixedAddr,
        city: fixedCity
      } : { address: fixedAddr, city: fixedCity }
    };
  }

  return ord;
};
