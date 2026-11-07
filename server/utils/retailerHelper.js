/**
 * Canonical Retailer Registry and Identity Resolver
 * Unifies the 4 primary retailers across the platform:
 * 1. Al-Fatah
 * 2. Chase Value
 * 3. Chase Up
 * 4. Unimart (safely resolves legacy FreshMart Direct references without duplicate records)
 */

export const PLATFORM_RETAILERS = [
  {
    id: 'tenant-alfatah',
    tenantId: 'tenant-alfatah',
    legacyIds: ['company_001', 'alfatah'],
    name: 'Al-Fatah',
    displayName: 'Al-Fatah Supermarket',
    slug: 'al-fatah',
    logo: '🏬',
    banner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    tagline: "Pakistan's Premier Department Store & Hypermarket Since 1941",
    themeColor: '#991b1b',
    ownerName: 'Sheikh Tariq Al-Fatah',
    ownerEmail: 'admin@alfatah.pk',
    status: 'Active'
  },
  {
    id: 'tenant-chasevalue',
    tenantId: 'tenant-chasevalue',
    legacyIds: ['company_003', 'chasevalue', 'casevalue'],
    name: 'Chase Value',
    displayName: 'Chase Value',
    slug: 'chase-value',
    logo: '🛒',
    banner: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Maximum Wholesale Value & Direct Factory Groceries',
    themeColor: '#854d0e',
    ownerName: 'Farhan Chase',
    ownerEmail: 'admin@chasevalue.pk',
    status: 'Active'
  },
  {
    id: 'tenant-chaseup',
    tenantId: 'tenant-chaseup',
    legacyIds: ['company_002', 'chaseup'],
    name: 'Chase Up',
    displayName: 'Chase Up',
    slug: 'chase-up',
    logo: '🏪',
    banner: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80',
    tagline: 'One-Stop Family Shopping & Fresh Supermarket Chain',
    themeColor: '#6b21a8',
    ownerName: 'Muhammad Salman Chase',
    ownerEmail: 'admin@chaseup.pk',
    status: 'Active'
  },
  {
    id: 'tenant-unimart',
    tenantId: 'tenant-unimart',
    legacyIds: ['tenant-freshmart', 'company_004', 'freshmart', 'unimart', 'unimaart'],
    name: 'Unimart',
    displayName: 'Unimart (Market Store)',
    slug: 'unimart',
    logo: '🛒',
    banner: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Fresh Food, Fair Prices, Fast Delivery',
    themeColor: '#0284c7',
    ownerName: 'Aimen Yasin',
    ownerEmail: 'support@unimart.pk',
    status: 'Active'
  }
];

export function resolveRetailerId(rawId) {
  if (!rawId) return 'tenant-unimart';
  const clean = String(rawId).toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  if (clean.includes('alfatah') || clean.includes('fatah') || clean === 'company001') {
    return 'tenant-alfatah';
  }
  if (clean.includes('chaseval') || clean.includes('caseval') || clean === 'cv' || clean === 'company003') {
    return 'tenant-chasevalue';
  }
  if (clean.includes('chaseup') || clean.includes('caseup') || clean === 'cu' || clean === 'company002') {
    return 'tenant-chaseup';
  }
  if (clean.includes('freshmart') || clean.includes('unimart') || clean.includes('unimaart') || clean === 'company004') {
    return 'tenant-unimart';
  }

  // Check against registry
  for (const r of PLATFORM_RETAILERS) {
    if (r.id === rawId || r.legacyIds.includes(rawId)) {
      return r.id;
    }
  }

  return rawId;
}

export function getRetailerDetails(rawId) {
  const resolved = resolveRetailerId(rawId);
  return (
    PLATFORM_RETAILERS.find((r) => r.id === resolved || r.legacyIds.includes(rawId)) || {
      id: rawId,
      tenantId: rawId,
      name: rawId,
      displayName: rawId,
      logo: '🏬',
      themeColor: '#059669',
      status: 'Active'
    }
  );
}
