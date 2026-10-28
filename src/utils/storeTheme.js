/**
 * Dynamic Supermarket Store Theme Provider
 * Dynamically resolves brand colors, dark sidebar palettes, and accents
 * for Admin, Pickup Staff, Rider, and Customer portals across all stores.
 */

export const STORE_THEMES = {
  company_001: {
    id: 'company_001',
    slug: 'al-fatah',
    name: 'Al-Fatah',
    primary: '#991b1b', // Brand Crimson Red
    primaryDark: '#7f1d1d',
    primaryLight: 'rgba(153, 27, 27, 0.15)',
    primaryBorder: 'rgba(153, 27, 27, 0.4)',
    sidebarBg: '#18090b', // Deep Dark Crimson Slate
    sidebarHeaderBg: '#240c10',
    sidebarFooterBg: '#1e0a0d',
    sidebarBorder: '#3d1419',
    activeBg: '#991b1b',
    activeText: '#ffffff',
    activeGlow: '0 4px 14px rgba(153, 27, 27, 0.5)',
    badgeBg: '#451016',
    badgeText: '#fca5a5',
    accentText: '#f87171',
    customerProfileGradient: 'from-[#2e0b10] via-[#52131b] to-[#991b1b]',
    customerRing: 'rgba(239, 68, 68, 0.3)'
  },

  company_002: {
    id: 'company_002',
    slug: 'chase-up',
    name: 'Chase Up',
    primary: '#6b21a8', // Royal Purple
    primaryDark: '#581c87',
    primaryLight: 'rgba(107, 33, 168, 0.15)',
    primaryBorder: 'rgba(107, 33, 168, 0.4)',
    sidebarBg: '#13091f', // Deep Dark Purple Slate
    sidebarHeaderBg: '#1e0d30',
    sidebarFooterBg: '#190a28',
    sidebarBorder: '#361456',
    activeBg: '#6b21a8',
    activeText: '#ffffff',
    activeGlow: '0 4px 14px rgba(107, 33, 168, 0.5)',
    badgeBg: '#3b1261',
    badgeText: '#d8b4fe',
    accentText: '#c084fc',
    customerProfileGradient: 'from-[#1f0b33] via-[#3d1466] to-[#6b21a8]',
    customerRing: 'rgba(168, 85, 247, 0.3)'
  },

  company_003: {
    id: 'company_003',
    slug: 'chase-value',
    name: 'CaseValue',
    primary: '#1e40af', // Royal Navy Blue
    primaryDark: '#1e3a8a',
    primaryLight: 'rgba(30, 64, 175, 0.15)',
    primaryBorder: 'rgba(30, 64, 175, 0.4)',
    sidebarBg: '#0a1226', // Deep Dark Navy Slate
    sidebarHeaderBg: '#0f1c3d',
    sidebarFooterBg: '#0d1733',
    sidebarBorder: '#1c2e5e',
    activeBg: '#1e40af',
    activeText: '#ffffff',
    activeGlow: '0 4px 14px rgba(30, 64, 175, 0.5)',
    badgeBg: '#172554',
    badgeText: '#93c5fd',
    accentText: '#60a5fa',
    customerProfileGradient: 'from-[#0b1736] via-[#162c66] to-[#1e40af]',
    customerRing: 'rgba(59, 130, 246, 0.3)'
  },

  company_004: {
    id: 'company_004',
    slug: 'unimaart',
    name: 'Unimaart',
    primary: '#0284c7', // Vibrant Sapphire Blue (as requested: Unimaart blue theme)
    primaryDark: '#0369a1',
    primaryLight: 'rgba(2, 132, 199, 0.15)',
    primaryBorder: 'rgba(2, 132, 199, 0.4)',
    sidebarBg: '#06152b', // Deep Dark Ocean Blue Slate
    sidebarHeaderBg: '#0a2244',
    sidebarFooterBg: '#081c38',
    sidebarBorder: '#12396b',
    activeBg: '#0284c7',
    activeText: '#ffffff',
    activeGlow: '0 4px 14px rgba(2, 132, 199, 0.5)',
    badgeBg: '#0c356a',
    badgeText: '#7dd3fc',
    accentText: '#38bdf8',
    customerProfileGradient: 'from-[#062444] via-[#093c70] to-[#0284c7]',
    customerRing: 'rgba(56, 189, 248, 0.3)'
  },

  freshmart: {
    id: 'freshmart',
    slug: 'freshmart',
    name: 'FreshMart',
    primary: '#059669', // Emerald Green
    primaryDark: '#047857',
    primaryLight: 'rgba(5, 150, 105, 0.15)',
    primaryBorder: 'rgba(5, 150, 105, 0.4)',
    sidebarBg: '#071a17', // Deep Dark Emerald Slate
    sidebarHeaderBg: '#0d2823',
    sidebarFooterBg: '#0a201c',
    sidebarBorder: '#154137',
    activeBg: '#059669',
    activeText: '#ffffff',
    activeGlow: '0 4px 14px rgba(5, 150, 105, 0.5)',
    badgeBg: '#064e3b',
    badgeText: '#6ee7b7',
    accentText: '#34d399',
    customerProfileGradient: 'from-[#07382c] via-[#0b4d3c] to-[#14765d]',
    customerRing: 'rgba(16, 185, 129, 0.3)'
  }
};

/**
 * Resolves the active store theme dynamically
 */
export const getStoreTheme = (tenantOrStore) => {
  if (!tenantOrStore) return STORE_THEMES.company_004; // Default to Unimaart if empty/null

  let key = '';
  if (typeof tenantOrStore === 'string') {
    key = tenantOrStore.toLowerCase().trim();
  } else if (typeof tenantOrStore === 'object') {
    key = String(
      tenantOrStore.tenantId ||
      tenantOrStore.id ||
      tenantOrStore._id ||
      tenantOrStore.legacyId ||
      tenantOrStore.slug ||
      tenantOrStore.name ||
      ''
    ).toLowerCase().trim();
  }

  // Exact ID match
  if (key === 'company_001' || key.includes('alfatah') || key.includes('fatah')) {
    return STORE_THEMES.company_001;
  }
  if (key === 'company_002' || key.includes('chaseup') || key.includes('chase up')) {
    return STORE_THEMES.company_002;
  }
  if (key === 'company_003' || key.includes('chasevalue') || key.includes('casevalue') || key.includes('chase value')) {
    return STORE_THEMES.company_003;
  }
  if (key === 'company_004' || key.includes('unimaart') || key.includes('unimart') || key.includes('freshmart')) {
    return STORE_THEMES.company_004;
  }

  return STORE_THEMES.company_004; // Fallback to Unimaart
};
