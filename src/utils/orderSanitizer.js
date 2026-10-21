import { isSameTenant } from '../data/companyHierarchyData.js';

export const sanitizeOrder = (ord) => {
  if (!ord) return ord;
  const idStr = String(ord.id || ord.orderId || ord._id || '').toLowerCase();
  const addrStr = `${ord.address || ''} ${ord.city || ''} ${ord.shippingAddress?.address || ''} ${ord.shippingAddress?.city || ''}`.toLowerCase();
  const rawItemList = Array.isArray(ord.rawItems)
    ? ord.rawItems
    : Array.isArray(ord.orderItems)
    ? ord.orderItems
    : Array.isArray(ord.items)
    ? ord.items
    : [];
  const isFsd = addrStr.includes('peoples colony') || addrStr.includes('faisalabad') || addrStr.includes('fsd');

  // Fix generic mock Lahore addresses
  let fixedAddress = ord.address;
  let fixedCity = ord.city;
  let fixedShippingAddress = ord.shippingAddress;
  if (addrStr.includes('gulberg iii, lahore') || addrStr.includes('main boulevard, gulberg') || !ord.address) {
    fixedAddress = 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad';
    fixedCity = 'Faisalabad';
    fixedShippingAddress = typeof ord.shippingAddress === 'object' && ord.shippingAddress ? {
      ...ord.shippingAddress,
      address: fixedAddress,
      city: fixedCity
    } : { address: fixedAddress, city: fixedCity };
  }

  // Check if items list contains store-specific brand keywords (for recovering stored orders)
  const hasCaseValueItem = rawItemList.some((it) => {
    const name = String(it?.name || it?.productName || '').toLowerCase();
    const brand = String(it?.brand || '').toLowerCase();
    const tId = it?.tenantId || it?.product?.tenantId;
    return (
      name.includes('chase value') ||
      name.includes('case value') ||
      brand.includes('chase value') ||
      brand.includes('case value') ||
      isSameTenant(tId, 'tenant-chasevalue')
    );
  });

  const hasChaseUpItem = rawItemList.some((it) => {
    const name = String(it?.name || it?.productName || '').toLowerCase();
    const brand = String(it?.brand || '').toLowerCase();
    const tId = it?.tenantId || it?.product?.tenantId;
    return (
      name.includes('chase up') ||
      name.includes('case up') ||
      name.includes('caseup') ||
      name.includes('chaseup') ||
      brand.includes('chase up') ||
      brand.includes('case up') ||
      brand.includes('caseup') ||
      brand.includes('chaseup') ||
      isSameTenant(tId, 'tenant-chaseup')
    );
  });

  // 1. Detect Case Value / Chase Value
  const isExplicitCaseValue =
    isSameTenant(ord.tenantId, 'tenant-chasevalue') ||
    isSameTenant(ord.tenantId, 'company_003') ||
    (ord.tenantName && (String(ord.tenantName).toLowerCase().includes('case value') || String(ord.tenantName).toLowerCase().includes('chase value'))) ||
    hasCaseValueItem ||
    ((idStr.startsWith('#cv') || idStr.startsWith('cv-') || idStr.startsWith('ord-cv') || idStr.includes('-cv-')) && (!ord.tenantId || isSameTenant(ord.tenantId, 'tenant-chasevalue')));

  if (isExplicitCaseValue) {
    return {
      ...ord,
      tenantId: 'tenant-chasevalue',
      tenantName: ord.tenantName || 'Case Value (Local Grocery)',
      branchId: ord.branchId || (isFsd ? 'branch_cv_fsd' : 'branch_007'),
      branchName: ord.branchName || (isFsd ? 'Wholesale Express Hub' : 'Shaheed-e-Millat Main Branch (Karachi)'),
      address: fixedAddress || ord.address,
      city: fixedCity || ord.city,
      shippingAddress: fixedShippingAddress || ord.shippingAddress,
      status: ord.status || 'Pending'
    };
  }

  // 2. Detect Chase Up / Case Up
  const isExplicitChaseUp =
    isSameTenant(ord.tenantId, 'tenant-chaseup') ||
    isSameTenant(ord.tenantId, 'company_002') ||
    (ord.tenantName && (
      String(ord.tenantName).toLowerCase().includes('chase up') ||
      String(ord.tenantName).toLowerCase().includes('case up') ||
      String(ord.tenantName).toLowerCase().includes('caseup') ||
      String(ord.tenantName).toLowerCase().includes('chaseup')
    )) ||
    hasChaseUpItem ||
    ((idStr.startsWith('#cu') || idStr.startsWith('cu-') || idStr.startsWith('cu') || idStr.startsWith('ord-cu') || idStr.includes('-cu-') || idStr.includes('caseup')) && (!ord.tenantId || isSameTenant(ord.tenantId, 'tenant-chaseup')));

  if (isExplicitChaseUp) {
    return {
      ...ord,
      tenantId: 'tenant-chaseup',
      tenantName: ord.tenantName || 'Chase Up',
      branchId: ord.branchId || (isFsd ? 'branch_006' : 'branch_004'),
      branchName: ord.branchName || (isFsd ? 'Faisalabad Clock Tower Hub' : 'Clifton Main Branch (Karachi)'),
      address: fixedAddress || ord.address,
      city: fixedCity || ord.city,
      shippingAddress: fixedShippingAddress || ord.shippingAddress,
      status: ord.status || 'Pending'
    };
  }

  // 3. Detect Al-Fatah
  const isExplicitAlfatah =
    isSameTenant(ord.tenantId, 'tenant-alfatah') ||
    isSameTenant(ord.tenantId, 'company_001') ||
    (ord.tenantName && String(ord.tenantName).toLowerCase().includes('fatah')) ||
    ((idStr.includes('701') || idStr.startsWith('ord-701') || idStr.startsWith('#ord-701') || idStr.startsWith('#af') || idStr.startsWith('af-')) &&
      (!ord.tenantId || isSameTenant(ord.tenantId, 'tenant-alfatah')));

  if (isExplicitAlfatah) {
    const hasUnimaartBranch = Boolean(ord.branchName && (ord.branchName.includes('Dark Store') || ord.branchName.includes('Unimaart') || ord.branchId === 'branch_um_fsd'));
    const resolvedBranchId = (!ord.branchId || hasUnimaartBranch) ? (isFsd ? 'branch_af_fsd' : 'branch_001') : ord.branchId;
    const resolvedBranchName = (!ord.branchName || hasUnimaartBranch) ? (isFsd ? 'D-Ground Flagship Hub' : 'Gulberg Mall') : ord.branchName;

    return {
      ...ord,
      id: ord.id || ord.orderId || 'ORD-701',
      orderId: ord.orderId || ord.id || 'ORD-701',
      tenantId: 'tenant-alfatah',
      tenantName: 'Al-Fatah Supermarket',
      branchId: resolvedBranchId,
      branchName: resolvedBranchName,
      address: fixedAddress || ord.address,
      city: fixedCity || ord.city,
      shippingAddress: fixedShippingAddress || ord.shippingAddress,
      status: ord.status || 'Pending'
    };
  }

  // 4. Detect Unimaart / FreshMart
  const isExplicitUnimaart =
    isSameTenant(ord.tenantId, 'tenant-freshmart') ||
    isSameTenant(ord.tenantId, 'company_004') ||
    (ord.tenantName && (String(ord.tenantName).toLowerCase().includes('unimaart') || String(ord.tenantName).toLowerCase().includes('unimart') || String(ord.tenantName).toLowerCase().includes('freshmart'))) ||
    ((idStr.includes('fm83459') || idStr.includes('83459') || idStr.startsWith('#fm') || idStr.startsWith('fm-')) &&
      (!ord.tenantId || isSameTenant(ord.tenantId, 'tenant-freshmart')));

  if (isExplicitUnimaart) {
    return {
      ...ord,
      id: ord.id || ord.orderId || '#FM83459',
      orderId: ord.orderId || ord.id || '#FM83459',
      tenantId: 'tenant-freshmart',
      tenantName: ord.tenantName || 'Unimaart (Market Store)',
      branchId: ord.branchId || (isFsd ? 'branch_um_fsd' : 'branch_010'),
      branchName: ord.branchName || (isFsd ? 'Peoples Colony Dark Store' : 'Gulberg SuperHub'),
      address: fixedAddress || ord.address,
      city: fixedCity || ord.city,
      shippingAddress: fixedShippingAddress || ord.shippingAddress,
      status: ord.status || 'Pending'
    };
  }

  return {
    ...ord,
    address: fixedAddress || ord.address,
    city: fixedCity || ord.city,
    shippingAddress: fixedShippingAddress || ord.shippingAddress
  };
};
