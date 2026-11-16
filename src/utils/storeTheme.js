/**
 * Dynamic Supermarket Store Theme Provider
 * Dynamically resolves brand colors, sidebar palettes, and accents
 * for Admin, Pickup Staff, Rider, and Customer portals across all stores:
 *
 * 1. Case Value -> Brown sidebar
 * 2. Uni Mart   -> Light blue sidebar (as Unimaart has)
 * 3. Al-Fatah   -> Red sidebar
 * 4. Chase Up   -> Purple sidebar
 */

export const STORE_THEMES = {
  // 1. Al-Fatah: Vibrant Crimson Red Theme
  company_001: {
    id: 'company_001',
    slug: 'al-fatah',
    name: 'Al-Fatah',
    colorName: 'Red',
    primary: '#b91c1c', // Muted Red
    primaryDark: '#7f1d1d',
    primaryLight: 'rgba(185, 28, 28, 0.12)',
    primaryBorder: 'rgba(185, 28, 28, 0.25)',
    sidebarBg: '#3f1414', // Calmer, slightly greyer and darker ruby red sidebar
    sidebarHeaderBg: '#4e1616', // Deep muted red header
    sidebarFooterBg: '#320e0e', // Muted red footer
    sidebarBorder: '#5d1d1d', // Muted red border
    activeBg: '#b91c1c', // Muted red active button
    activeText: '#ffffff',
    activeGlow: 'none',
    badgeBg: '#5c1313',
    badgeText: '#fee2e2',
    accentText: '#e8b4b4', // Soft pink/red accent
    customerProfileGradient: 'from-[#4a0b0b] via-[#7f1d1d] to-[#dc2626]',
    customerRing: 'rgba(185, 28, 28, 0.25)'
  },

  // 2. Chase Up: Vibrant Royal Purple Theme
  company_002: {
    id: 'company_002',
    slug: 'chase-up',
    name: 'Chase Up',
    colorName: 'Purple',
    primary: '#7d2fc3', // Muted Royal Purple
    primaryDark: '#581c87',
    primaryLight: 'rgba(125, 47, 195, 0.12)',
    primaryBorder: 'rgba(125, 47, 195, 0.25)',
    sidebarBg: '#32144c', // Calmer, slightly greyer and darker royal purple sidebar
    sidebarHeaderBg: '#401961', // Deep muted purple header
    sidebarFooterBg: '#270e3c', // Muted purple footer
    sidebarBorder: '#4d2074', // Muted purple border
    activeBg: '#7d2fc3', // Muted purple active button
    activeText: '#ffffff',
    activeGlow: 'none',
    badgeBg: '#45146b',
    badgeText: '#f3e8ff',
    accentText: '#d4baef', // Softer lavender accent
    customerProfileGradient: 'from-[#2a0747] via-[#581c87] to-[#9333ea]',
    customerRing: 'rgba(125, 47, 195, 0.25)'
  },

  // 3. Case Value / Chase Value: Warm Brown Theme
  company_003: {
    id: 'company_003',
    slug: 'chase-value',
    name: 'Case Value',
    colorName: 'Brown',
    primary: '#6d4517', // Muted Warm Saddle Brown
    primaryDark: '#43210d',
    primaryLight: 'rgba(109, 69, 23, 0.12)',
    primaryBorder: 'rgba(109, 69, 23, 0.25)',
    sidebarBg: '#26160d', // Calmer, slightly greyer and darker warm coffee/saddle brown sidebar
    sidebarHeaderBg: '#331e12', // Warm muted brown header
    sidebarFooterBg: '#1f120a', // Deep muted warm brown footer
    sidebarBorder: '#402616', // Muted brown border
    activeBg: '#6d4517', // Muted golden-brown active button
    activeText: '#ffffff',
    activeGlow: 'none',
    badgeBg: '#351402',
    badgeText: '#fef3c7',
    accentText: '#c28c31', // Softer amber/gold accent
    customerProfileGradient: 'from-[#2d1609] via-[#451a03] to-[#854d0e]',
    customerRing: 'rgba(109, 69, 23, 0.25)'
  },

  // 4. Unimaart / Uni Mart: Light Blue Theme
  company_004: {
    id: 'company_004',
    slug: 'unimaart',
    name: 'Unimaart',
    colorName: 'Light Blue',
    primary: '#126b98', // Muted Unimaart Sky Blue
    primaryDark: '#075985',
    primaryLight: 'rgba(18, 107, 152, 0.12)',
    primaryBorder: 'rgba(18, 107, 152, 0.25)',
    sidebarBg: '#174565', // Calmer, slightly greyer and darker light blue sidebar
    sidebarHeaderBg: '#11344d', // Deep muted sky header
    sidebarFooterBg: '#0e2b41', // Muted sky footer
    sidebarBorder: '#1f4f72', // Muted blue border
    activeBg: '#126b98', // Muted Unimaart blue active button
    activeText: '#ffffff',
    activeGlow: 'none',
    badgeBg: '#0b4c70',
    badgeText: '#e0f2fe',
    accentText: '#8dc8e4', // Soft sky blue accent
    customerProfileGradient: 'from-[#07395c] via-[#0a4b78] to-[#0284c7]',
    customerRing: 'rgba(18, 107, 152, 0.25)'
  },

  // 5. FreshMart: Emerald Green Theme
  freshmart: {
    id: 'freshmart',
    slug: 'freshmart',
    name: 'FreshMart',
    colorName: 'Emerald Green',
    primary: '#157758', // Muted Emerald Green
    primaryDark: '#0e523d',
    primaryLight: 'rgba(21, 119, 88, 0.12)',
    primaryBorder: 'rgba(21, 119, 88, 0.25)',
    sidebarBg: '#0e2b23', // Calmer, slightly greyer and darker emerald green sidebar
    sidebarHeaderBg: '#13382e',
    sidebarFooterBg: '#0a201a',
    sidebarBorder: '#184438',
    activeBg: '#157758',
    activeText: '#ffffff',
    activeGlow: 'none',
    badgeBg: '#084232',
    badgeText: '#6ee7b7',
    accentText: '#49b18b', // Softer emerald accent
    customerProfileGradient: 'from-[#07261d] via-[#093327] to-[#059669]',
    customerRing: 'rgba(21, 119, 88, 0.25)'
  }
};

// Friendly aliases for convenience
STORE_THEMES.al_fatah = STORE_THEMES.company_001;
STORE_THEMES.alfatah = STORE_THEMES.company_001;
STORE_THEMES.al_fateh = STORE_THEMES.company_001;
STORE_THEMES.alfateh = STORE_THEMES.company_001;
STORE_THEMES.chase_up = STORE_THEMES.company_002;
STORE_THEMES.chaseup = STORE_THEMES.company_002;
STORE_THEMES.case_value = STORE_THEMES.company_003;
STORE_THEMES.casevalue = STORE_THEMES.company_003;
STORE_THEMES.chase_value = STORE_THEMES.company_003;
STORE_THEMES.chasevalue = STORE_THEMES.company_003;
STORE_THEMES.unimaart = STORE_THEMES.company_004;
STORE_THEMES.unimart = STORE_THEMES.company_004;

/**
 * Resolves the active store theme dynamically
 */
export const getStoreTheme = (tenantOrStore) => {
  if (!tenantOrStore) return STORE_THEMES.company_004; // Default to Unimaart if empty/null

  let key = '';
  if (typeof tenantOrStore === 'string') {
    key = tenantOrStore.toLowerCase().trim();
  } else if (typeof tenantOrStore === 'object') {
    key = [
      tenantOrStore.tenantId,
      tenantOrStore.id,
      tenantOrStore._id,
      tenantOrStore.legacyId,
      tenantOrStore.slug,
      tenantOrStore.name,
      tenantOrStore.displayName,
      tenantOrStore.tenantName,
      tenantOrStore.companyId
    ].filter(Boolean).join(' ').toLowerCase().trim();
  }

  // 1. Al-Fatah / Al-Fateh (Red)
  if (
    key === 'company_001' ||
    key.includes('alfatah') ||
    key.includes('al-fatah') ||
    key.includes('alfateh') ||
    key.includes('al-fateh') ||
    key.includes('al fateh') ||
    key.includes('fatah') ||
    key.includes('fateh')
  ) {
    return STORE_THEMES.company_001;
  }

  // 2. Chase Up (Purple)
  if (
    key === 'company_002' ||
    key.includes('chaseup') ||
    key.includes('chase up') ||
    key.includes('chase-up')
  ) {
    return STORE_THEMES.company_002;
  }

  // 3. Case Value / Chase Value (Brown)
  if (
    key === 'company_003' ||
    key.includes('chasevalue') ||
    key.includes('casevalue') ||
    key.includes('chase value') ||
    key.includes('case value') ||
    key.includes('chase-value') ||
    key.includes('case-value')
  ) {
    return STORE_THEMES.company_003;
  }

  // 4. Unimaart / Uni Mart (Light Blue)
  if (
    key === 'company_004' ||
    key.includes('unimaart') ||
    key.includes('unimart') ||
    key.includes('uni mart') ||
    key.includes('uni-mart') ||
    key.includes('tenant-freshmart')
  ) {
    return STORE_THEMES.company_004;
  }

  // 5. FreshMart
  if (key.includes('freshmart')) {
    return STORE_THEMES.freshmart;
  }

  return STORE_THEMES.company_004; // Fallback to Unimaart
};
