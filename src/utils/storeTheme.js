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
    primary: '#dc2626', // Vibrant Red
    primaryDark: '#991b1b',
    primaryLight: 'rgba(220, 38, 38, 0.2)',
    primaryBorder: 'rgba(248, 113, 113, 0.5)',
    sidebarBg: '#4a0b0b', // Distinct, rich ruby red sidebar
    sidebarHeaderBg: '#5c0d0d', // Deep red header
    sidebarFooterBg: '#3b0808', // Red footer
    sidebarBorder: '#7a1515', // Vibrant red border
    activeBg: '#dc2626', // Vibrant red active button
    activeText: '#ffffff',
    activeGlow: '0 4px 14px rgba(220, 38, 38, 0.55)',
    badgeBg: '#7f1d1d',
    badgeText: '#fee2e2',
    accentText: '#fca5a5', // Soft pink/red accent
    customerProfileGradient: 'from-[#4a0b0b] via-[#7f1d1d] to-[#dc2626]',
    customerRing: 'rgba(239, 68, 68, 0.4)'
  },

  // 2. Chase Up: Vibrant Royal Purple Theme
  company_002: {
    id: 'company_002',
    slug: 'chase-up',
    name: 'Chase Up',
    colorName: 'Purple',
    primary: '#9333ea', // Royal Purple
    primaryDark: '#6b21a8',
    primaryLight: 'rgba(147, 51, 234, 0.2)',
    primaryBorder: 'rgba(192, 132, 252, 0.5)',
    sidebarBg: '#350b5a', // Distinct, rich royal purple sidebar
    sidebarHeaderBg: '#440e73', // Deep purple header
    sidebarFooterBg: '#2a0747', // Purple footer
    sidebarBorder: '#5b1599', // Bright purple border
    activeBg: '#9333ea', // Vibrant purple active button
    activeText: '#ffffff',
    activeGlow: '0 4px 14px rgba(147, 51, 234, 0.55)',
    badgeBg: '#581c87',
    badgeText: '#f3e8ff',
    accentText: '#d8b4fe', // Bright lavender accent
    customerProfileGradient: 'from-[#2a0747] via-[#581c87] to-[#9333ea]',
    customerRing: 'rgba(168, 85, 247, 0.4)'
  },

  // 3. Case Value / Chase Value: Warm Brown Theme
  company_003: {
    id: 'company_003',
    slug: 'chase-value',
    name: 'Case Value',
    colorName: 'Brown',
    primary: '#854d0e', // Warm Saddle Brown
    primaryDark: '#542a12',
    primaryLight: 'rgba(180, 83, 9, 0.2)',
    primaryBorder: 'rgba(180, 83, 9, 0.5)',
    sidebarBg: '#2d1609', // Distinct, rich warm coffee/saddle brown sidebar
    sidebarHeaderBg: '#3c1e0d', // Warm brown header
    sidebarFooterBg: '#241207', // Deep warm brown footer
    sidebarBorder: '#542a12', // Rich brown border
    activeBg: '#854d0e', // Warm golden-brown active button
    activeText: '#ffffff',
    activeGlow: '0 4px 14px rgba(180, 83, 9, 0.55)',
    badgeBg: '#451a03',
    badgeText: '#fef3c7',
    accentText: '#f59e0b', // Amber/gold accent
    customerProfileGradient: 'from-[#2d1609] via-[#451a03] to-[#854d0e]',
    customerRing: 'rgba(217, 119, 6, 0.4)'
  },

  // 4. Unimaart / Uni Mart: Light Blue Theme
  company_004: {
    id: 'company_004',
    slug: 'unimaart',
    name: 'Unimaart',
    colorName: 'Light Blue',
    primary: '#0284c7', // Unimaart Signature Sky Blue
    primaryDark: '#0369a1',
    primaryLight: 'rgba(2, 132, 199, 0.2)',
    primaryBorder: 'rgba(56, 189, 248, 0.5)',
    sidebarBg: '#0a4b78', // Distinct, vibrant light blue sidebar
    sidebarHeaderBg: '#07395c', // Polished deep sky header
    sidebarFooterBg: '#062f4d', // Sky footer
    sidebarBorder: '#146096', // Light blue border
    activeBg: '#0284c7', // Vibrant Unimaart blue active button
    activeText: '#ffffff',
    activeGlow: '0 4px 14px rgba(2, 132, 199, 0.55)',
    badgeBg: '#075985',
    badgeText: '#e0f2fe',
    accentText: '#7dd3fc', // Bright sky light blue accent
    customerProfileGradient: 'from-[#07395c] via-[#0a4b78] to-[#0284c7]',
    customerRing: 'rgba(56, 189, 248, 0.4)'
  },

  // 5. FreshMart: Emerald Green Theme
  freshmart: {
    id: 'freshmart',
    slug: 'freshmart',
    name: 'FreshMart',
    colorName: 'Emerald Green',
    primary: '#059669', // Emerald Green
    primaryDark: '#047857',
    primaryLight: 'rgba(5, 150, 105, 0.2)',
    primaryBorder: 'rgba(52, 211, 153, 0.5)',
    sidebarBg: '#093327', // Distinct, rich emerald green sidebar
    sidebarHeaderBg: '#0d4233',
    sidebarFooterBg: '#06261d',
    sidebarBorder: '#145945',
    activeBg: '#059669',
    activeText: '#ffffff',
    activeGlow: '0 4px 14px rgba(5, 150, 105, 0.55)',
    badgeBg: '#064e3b',
    badgeText: '#6ee7b7',
    accentText: '#34d399',
    customerProfileGradient: 'from-[#07261d] via-[#093327] to-[#059669]',
    customerRing: 'rgba(16, 185, 129, 0.4)'
  }
};

// Friendly aliases for convenience
STORE_THEMES.al_fatah = STORE_THEMES.company_001;
STORE_THEMES.alfatah = STORE_THEMES.company_001;
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

  // 1. Al-Fatah (Red)
  if (
    key === 'company_001' ||
    key.includes('alfatah') ||
    key.includes('al-fatah') ||
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
