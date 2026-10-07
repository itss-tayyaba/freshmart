/**
 * Smart Product Substitution Engine
 * 
 * Rules:
 * 1. Match by Category + Product Type + Size/Quantity.
 * 2. Strictly filter out unrelated products (e.g. no butter for ghee, no oil for ghee, no tea for coffee).
 * 3. Candidates MUST be currently in stock.
 * 4. Rank candidates by:
 *    - Product Type fidelity (Exact subtype match)
 *    - Size / Quantity match (Exact size preferred, e.g. 1kg -> 1kg)
 *    - Price proximity (|price - targetPrice|)
 *    - Brand variety (Alternative trusted brands when original is OOS)
 *    - Dark store stock availability
 * 5. Provide order history preservation schema for original + substituted products.
 */

// Known Pakistani and international grocery brand list
export const KNOWN_BRANDS = [
  'dalda', 'habib', 'kashmir', 'sufi', 'mezan', 'olper\'s', 'olpers', 'milkpak', 'nurpur',
  'tarang', 'nestle', 'tapal', 'lipton', 'tetley', 'vital', 'supreme', 'guard', 'falak',
  'sunridge', 'national', 'shan', 'mitchell\'s', 'mitchells', 'dawn', 'bake parlor', 'kolson',
  'knorr', 'maggi', 'surf excel', 'ariel', 'bonus', 'bright', 'safeguard', 'dettol',
  'lifebuoy', 'lux', 'sunsilk', 'pantene', 'head & shoulders', 'colgate', 'sensodyne',
  'close up', 'lays', 'kurkure', 'cheetos', 'cadbury', 'kitkat', 'oreo', 'lu', 'peek freans',
  'english biscuit', 'coca-cola', 'pepsi', 'sprite', '7up', 'marinda', 'pakola', 'rooh afza',
  'jam-e-shirin', 'tang', 'quaker', 'fauji', 'haleeb', 'al-fatah signature', 'lindt',
  'borges', 'president', 'chase value', 'chase up', 'freshmart organics'
];

// Product types dictionary with keywords and negative keywords to avoid false matches
export const PRODUCT_TYPE_TAXONOMY = {
  'banaspati-ghee': {
    label: 'Banaspati Ghee',
    keywords: ['banaspati ghee', 'banaspati', 'desi ghee', 'pure ghee', 'ghee'],
    negativeKeywords: ['cooking oil', 'canola oil', 'sunflower oil', 'corn oil', 'olive oil', 'butter']
  },
  'cooking-oil': {
    label: 'Cooking Oil',
    keywords: ['cooking oil', 'canola oil', 'sunflower oil', 'corn oil', 'vegetable oil', 'mustard oil', 'soybean oil', 'oil'],
    negativeKeywords: ['ghee', 'banaspati', 'hair oil', 'olive oil']
  },
  'olive-oil': {
    label: 'Olive Oil',
    keywords: ['olive oil', 'extra virgin olive oil', 'pomace olive oil', 'evoo'],
    negativeKeywords: ['banaspati', 'ghee']
  },
  'milk': {
    label: 'Milk',
    keywords: ['uht milk', 'full cream milk', 'pasteurized milk', 'toned milk', 'tea whitener', 'milk'],
    negativeKeywords: ['milk chocolate', 'milkshake', 'butter', 'yogurt', 'curd', 'cheese', 'powdered milk']
  },
  'yogurt': {
    label: 'Yogurt',
    keywords: ['yogurt', 'curd', 'dahi', 'greek yogurt', 'raita'],
    negativeKeywords: ['milk', 'ice cream']
  },
  'butter': {
    label: 'Butter',
    keywords: ['butter', 'makhan', 'salted butter', 'unsalted butter'],
    negativeKeywords: ['peanut butter', 'ghee', 'oil', 'biscuit', 'cookie']
  },
  'cheese': {
    label: 'Cheese',
    keywords: ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'slice cheese', 'paneer'],
    negativeKeywords: ['cheese balls', 'biscuit', 'crackers']
  },
  'eggs': {
    label: 'Eggs',
    keywords: ['eggs', 'farm eggs', 'desi eggs', 'white eggs', 'brown eggs'],
    negativeKeywords: ['egg noodles', 'mayo', 'mayonnaise']
  },
  'basmati-rice': {
    label: 'Basmati Rice',
    keywords: ['basmati rice', 'super kernel basmati', 'sella rice', 'kainat rice', 'rice', 'chawal'],
    negativeKeywords: ['rice paper', 'rice flour', 'atta', 'flour']
  },
  'atta-flour': {
    label: 'Atta & Flour',
    keywords: ['atta', 'wheat flour', 'chakki atta', 'maida', 'fine atta', 'flour'],
    negativeKeywords: ['biscuit', 'cake', 'bread', 'rice']
  },
  'pulses-lentils': {
    label: 'Pulses & Lentils (Daal)',
    keywords: ['daal', 'dal', 'lentils', 'pulses', 'daal chana', 'daal moong', 'daal masoor', 'daal mash', 'chickpeas', 'lobia'],
    negativeKeywords: ['daal moth', 'chips', 'nimco']
  },
  'sugar': {
    label: 'Sugar & Sweeteners',
    keywords: ['sugar', 'white sugar', 'refined sugar', 'brown sugar', 'shakar', 'gur', 'honey'],
    negativeKeywords: ['sugar free candy', 'biscuit']
  },
  'salt': {
    label: 'Salt',
    keywords: ['salt', 'iodized salt', 'pink salt', 'himalayan salt', 'table salt', 'namak'],
    negativeKeywords: ['salted butter', 'potato chips', 'crackers']
  },
  'tea-chai': {
    label: 'Tea & Chai',
    keywords: ['tea', 'black tea', 'danedar tea', 'danedar', 'chai', 'tea bags', 'green tea'],
    negativeKeywords: ['tea whitener', 'iced tea', 'coffee']
  },
  'coffee': {
    label: 'Coffee',
    keywords: ['coffee', 'instant coffee', 'ground coffee', 'espresso', 'cappuccino', 'nescafe'],
    negativeKeywords: ['coffee mug', 'tea']
  },
  'bread': {
    label: 'Bread',
    keywords: ['bread', 'sandwich bread', 'brown bread', 'white bread', 'bran bread', 'loaf', 'buns'],
    negativeKeywords: ['breadcrumbs', 'breadstick']
  },
  'detergent': {
    label: 'Detergent Powder',
    keywords: ['detergent', 'washing powder', 'laundry powder', 'surf'],
    negativeKeywords: ['liquid dishwash', 'soap bar', 'body wash']
  },
  'dishwash': {
    label: 'Dishwash',
    keywords: ['dishwash', 'dishwashing gel', 'dishwashing bar', 'lemon max', 'vim'],
    negativeKeywords: ['detergent powder', 'hand wash']
  },
  'soap-bodywash': {
    label: 'Soap & Body Wash',
    keywords: ['bath soap', 'beauty soap', 'body wash', 'shower gel', 'soap bar', 'hand wash'],
    negativeKeywords: ['dishwashing bar', 'detergent']
  },
  'shampoo': {
    label: 'Shampoo & Conditioner',
    keywords: ['shampoo', 'conditioner', 'hair wash'],
    negativeKeywords: ['body wash', 'soap']
  },
  'toothpaste': {
    label: 'Toothpaste & Oral Care',
    keywords: ['toothpaste', 'oral care', 'tooth paste', 'gel toothpaste'],
    negativeKeywords: ['toothbrush']
  },
  'potatoes': {
    label: 'Fresh Potatoes',
    keywords: ['potato', 'potatoes', 'aloo'],
    negativeKeywords: ['potato chips', 'crisps']
  },
  'onions': {
    label: 'Fresh Onions',
    keywords: ['onion', 'onions', 'pyaz'],
    negativeKeywords: ['onion powder']
  },
  'tomatoes': {
    label: 'Fresh Tomatoes',
    keywords: ['tomato', 'tomatoes', 'tamatar'],
    negativeKeywords: ['tomato paste', 'tomato ketchup', 'ketchup', 'puree']
  },
  'apples': {
    label: 'Fresh Apples',
    keywords: ['apple', 'apples', 'saib'],
    negativeKeywords: ['apple juice', 'cider']
  },
  'bananas': {
    label: 'Fresh Bananas',
    keywords: ['banana', 'bananas', 'kela'],
    negativeKeywords: ['banana shake', 'banana chips']
  },
  'chicken': {
    label: 'Fresh Chicken',
    keywords: ['chicken', 'boneless chicken', 'whole chicken', 'chicken breast', 'chicken karahi cuts'],
    negativeKeywords: ['chicken spread', 'chicken powder', 'chicken cube']
  }
};

/**
 * Normalizes text for case-insensitive matching
 */
export const normalizeText = (text = '') => {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Checks if a product is considered Out of Stock
 */
export const isProductOutOfStock = (product) => {
  if (!product) return false;
  if (product.inStock === false) return true;
  if (typeof product.stockCount === 'number' && product.stockCount <= 0) return true;
  if (typeof product.stock === 'number' && product.stock <= 0) return true;
  if (typeof product.status === 'string') {
    const s = product.status.toLowerCase().trim();
    if (s === 'out of stock' || s === 'oos' || s === 'out-of-stock') return true;
  }
  return false;
};

/**
 * Extracts size and unit from product name or unit property
 * e.g., "Dalda Banaspati Ghee 1kg" -> { raw: "1kg", value: 1000, unit: "g", normalized: "1kg", dimension: "weight" }
 */
export const extractSizeAndUnit = (productOrName, fallbackUnit = '') => {
  const name = typeof productOrName === 'string' ? productOrName : (productOrName?.name || '');
  const unit = typeof productOrName === 'object' ? (productOrName?.unit || fallbackUnit || '') : fallbackUnit;
  const combined = `${name} ${unit}`.toLowerCase();

  // 1. Weight matches (kg, g, gm, grams)
  const kgMatch = combined.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kgs)\b/i);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1]);
    return {
      raw: `${val}kg`,
      quantity: val,
      unit: 'kg',
      baseUnit: 'g',
      value: val * 1000,
      normalized: `${val}kg`,
      dimension: 'weight',
      type: 'weight'
    };
  }

  const gMatch = combined.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gms|gram|grams)\b/i);
  if (gMatch) {
    const val = parseFloat(gMatch[1]);
    if (val >= 1000) {
      return {
        raw: `${val}g`,
        quantity: val,
        unit: 'g',
        baseUnit: 'g',
        value: val,
        normalized: `${val / 1000}kg`,
        dimension: 'weight',
        type: 'weight'
      };
    }
    return {
      raw: `${val}g`,
      quantity: val,
      unit: 'g',
      baseUnit: 'g',
      value: val,
      normalized: `${val}g`,
      dimension: 'weight',
      type: 'weight'
    };
  }

  // 2. Volume matches (l, ltr, litre, liters, ml)
  const lMatch = combined.match(/(\d+(?:\.\d+)?)\s*(?:l|ltr|litre|litres|liter|liters)\b/i);
  if (lMatch) {
    const val = parseFloat(lMatch[1]);
    return {
      raw: `${val}L`,
      quantity: val,
      unit: 'l',
      baseUnit: 'ml',
      value: val * 1000,
      normalized: `${val}L`,
      dimension: 'volume',
      type: 'volume'
    };
  }

  const mlMatch = combined.match(/(\d+(?:\.\d+)?)\s*(?:ml|milli)\b/i);
  if (mlMatch) {
    const val = parseFloat(mlMatch[1]);
    if (val >= 1000) {
      return {
        raw: `${val}ml`,
        quantity: val,
        unit: 'ml',
        baseUnit: 'ml',
        value: val,
        normalized: `${val / 1000}L`,
        dimension: 'volume',
        type: 'volume'
      };
    }
    return {
      raw: `${val}ml`,
      quantity: val,
      unit: 'ml',
      baseUnit: 'ml',
      value: val,
      normalized: `${val}ml`,
      dimension: 'volume',
      type: 'volume'
    };
  }

  // 3. Piece / Count matches (pack, pcs, dozen)
  const dozenMatch = combined.match(/(\d+(?:\.\d+)?)\s*(?:dozen|doz)\b/i);
  if (dozenMatch) {
    const val = parseFloat(dozenMatch[1]);
    return {
      raw: `${val} dozen`,
      quantity: val,
      unit: 'dozen',
      baseUnit: 'pcs',
      value: val * 12,
      normalized: `${val * 12}pcs`,
      dimension: 'count',
      type: 'count'
    };
  }

  const pcsMatch = combined.match(/(\d+(?:\.\d+)?)\s*(?:pcs|pc|pieces|packs?)\b/i);
  if (pcsMatch) {
    const val = parseFloat(pcsMatch[1]);
    return {
      raw: `${val} pcs`,
      quantity: val,
      unit: 'pcs',
      baseUnit: 'pcs',
      value: val,
      normalized: `${val}pcs`,
      dimension: 'count',
      type: 'count'
    };
  }

  return {
    raw: unit || 'standard',
    quantity: 1,
    unit: 'unit',
    baseUnit: 'unit',
    value: 1,
    normalized: '1unit',
    dimension: 'generic',
    type: 'generic'
  };
};

/**
 * Extracts product brand name
 */
export const extractBrand = (productOrName) => {
  if (typeof productOrName === 'object' && productOrName?.brand && typeof productOrName.brand === 'string' && productOrName.brand.trim()) {
    return productOrName.brand.trim();
  }
  const rawName = typeof productOrName === 'string' ? productOrName : (productOrName?.name || '');
  const nameNorm = normalizeText(rawName);
  for (const b of KNOWN_BRANDS) {
    if (nameNorm === b || nameNorm.startsWith(b + ' ') || nameNorm.includes(' ' + b + ' ') || nameNorm.endsWith(' ' + b)) {
      return b.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  const firstWord = rawName.trim().split(' ')[0];
  return firstWord || 'Standard';
};

/**
 * Detects the specific product type
 */
export const extractProductType = (productOrName) => {
  const rawName = typeof productOrName === 'string' ? productOrName : (productOrName?.name || '');
  const rawCat = typeof productOrName === 'object' ? (productOrName?.category || productOrName?.categoryLabel || '') : '';
  const normName = normalizeText(rawName);
  const normCat = normalizeText(rawCat);

  // 1. Search in defined taxonomy with keyword checks and negative exclusions
  for (const [typeKey, typeDef] of Object.entries(PRODUCT_TYPE_TAXONOMY)) {
    // Check if any negative keyword is present
    const hasNegative = typeDef.negativeKeywords?.some((neg) => normName.includes(neg));
    if (hasNegative) continue;

    // Check if any positive keyword is matched
    const hasPositive = typeDef.keywords.some((kw) => normName.includes(kw));
    if (hasPositive) {
      return {
        id: typeKey,
        key: typeKey,
        label: typeDef.label,
        isCustom: false
      };
    }
  }

  // 2. Generic fallback: Strip brand and units to create a clean product type slug
  let cleanName = normName;
  for (const b of KNOWN_BRANDS) {
    cleanName = cleanName.replace(new RegExp(`\\b${b}\\b`, 'gi'), '');
  }
  // Strip size units and numbers
  cleanName = cleanName.replace(/\b\d+(\.\d+)?\s*(kg|g|l|ml|pcs|pack|gm|ltr)\b/gi, '');
  cleanName = cleanName.replace(/\b(pure|fresh|premium|quality|royal|supreme|best|natural|original|classic)\b/gi, '');
  cleanName = cleanName.replace(/\s+/g, ' ').trim();

  const generatedKey = cleanName ? cleanName.replace(/\s+/g, '-') : normCat || 'general-grocery';
  return {
    id: generatedKey,
    key: generatedKey,
    label: cleanName || normCat || 'Grocery Item',
    isCustom: true
  };
};

/**
 * Parses full product attributes for smart comparison
 */
export const parseProductAttributes = (product) => {
  if (!product) return null;
  const brand = extractBrand(product);
  const size = extractSizeAndUnit(product);
  const productType = extractProductType(product);
  const isOutOfStock = isProductOutOfStock(product);
  const category = normalizeText(product.category || product.categoryLabel || 'grocery');
  const price = Number(product.price || 0);

  return {
    id: product.id || product._id,
    name: product.name,
    brand,
    size,
    productType,
    isOutOfStock,
    category,
    price,
    inStock: !isOutOfStock,
    stockCount: Number(product.stockCount ?? product.stock ?? (isOutOfStock ? 0 : 50)),
    raw: product
  };
};

/**
 * Check if categories match or belong to compatible grocery groupings
 */
export const areCategoriesCompatible = (cat1, cat2) => {
  if (!cat1 || !cat2) return true;
  const c1 = normalizeText(cat1);
  const c2 = normalizeText(cat2);

  if (c1 === c2) return true;
  if (c1.includes(c2) || c2.includes(c1)) return true;

  // Grocery staples aliases
  const staples = ['grocery-staples', 'staples', 'grocery', 'oil', 'ghee', 'cooking-oils-ghee', 'rice-flour', 'spices', 'cooking-essentials', 'cooking'];
  if (staples.some(s => c1.includes(s)) && staples.some(s => c2.includes(s))) return true;

  // Dairy aliases
  const dairy = ['dairy-eggs', 'dairy', 'milk-cream', 'dairy-and-eggs'];
  if (dairy.some(s => c1.includes(s)) && dairy.some(s => c2.includes(s))) return true;

  // Beverages
  const beverages = ['beverages', 'drinks-juice', 'drinks', 'beverage', 'tea-coffee'];
  if (beverages.some(s => c1.includes(s)) && beverages.some(s => c2.includes(s))) return true;

  // Household / Cleaning
  const household = ['home-kitchen', 'cleaning-household', 'household', 'cleaning'];
  if (household.some(s => c1.includes(s)) && household.some(s => c2.includes(s))) return true;

  return false;
};

/**
 * Finds and ranks smart product alternatives for an out-of-stock product.
 * 
 * @param {Object} targetProduct - The out-of-stock product
 * @param {Array} candidatePool - List of products to search for alternatives
 * @param {Object} options - Configuration options (limit, allowSameBrand, tenantId)
 * @returns {Array} List of ranked alternative products with match details
 */
export const findProductSubstitutes = (targetProduct, candidatePool = [], options = {}) => {
  if (!targetProduct || !Array.isArray(candidatePool) || candidatePool.length === 0) {
    return [];
  }

  const targetAttrs = parseProductAttributes(targetProduct);
  const targetId = String(targetProduct.id || targetProduct._id || '');
  const limit = options.limit || 4;
  const preferredTenantId = options.tenantId || targetProduct.tenantId;

  const validCandidates = [];

  for (const item of candidatePool) {
    if (!item) continue;
    const candId = String(item.id || item._id || '');
    // 1. Skip same item
    if (candId && candId === targetId) continue;
    if (item.name && item.name.toLowerCase().trim() === targetProduct.name.toLowerCase().trim()) continue;

    // 2. Candidate MUST be strictly in stock
    if (isProductOutOfStock(item)) continue;

    const candAttrs = parseProductAttributes(item);

    // 3. Category match check
    if (!areCategoriesCompatible(targetAttrs.category, candAttrs.category)) {
      continue;
    }

    // 4. Product Type Match (Strict: "Do NOT suggest unrelated products")
    // e.g. Banaspati Ghee must match Banaspati Ghee, NOT cooking oil or rice or butter!
    let isTypeMatch = false;
    let typeScore = 0;

    if (targetAttrs.productType.key === candAttrs.productType.key) {
      isTypeMatch = true;
      typeScore = 100;
    } else if (
      !targetAttrs.productType.isCustom &&
      !candAttrs.productType.isCustom &&
      targetAttrs.productType.key !== candAttrs.productType.key
    ) {
      // Both are known standard taxonomies and they differ -> REJECT!
      continue;
    } else {
      // For custom types, check strict word token overlap
      const targetTokens = targetAttrs.productType.key.split('-').filter(t => t.length > 2);
      const candTokens = candAttrs.productType.key.split('-').filter(t => t.length > 2);
      const sharedTokens = targetTokens.filter(t => candTokens.includes(t));

      if (sharedTokens.length > 0 && sharedTokens.length >= Math.min(targetTokens.length, candTokens.length)) {
        isTypeMatch = true;
        typeScore = 70;
      } else {
        continue; // Unrelated product type!
      }
    }

    // 5. Size / Quantity Scoring
    let sizeScore = 0;
    let isExactSizeMatch = false;
    let sizeMatchLabel = 'Alternative Size';

    if (targetAttrs.size.normalized === candAttrs.size.normalized) {
      isExactSizeMatch = true;
      sizeScore = 80;
      sizeMatchLabel = `Exact ${candAttrs.size.normalized.toUpperCase()} Match`;
    } else if (targetAttrs.size.dimension === candAttrs.size.dimension) {
      // Same dimension (weight vs weight, volume vs volume)
      const ratio = targetAttrs.size.value > 0 ? candAttrs.size.value / targetAttrs.size.value : 1;
      if (ratio >= 0.7 && ratio <= 1.3) {
        sizeScore = 40;
        sizeMatchLabel = `Close Size (${candAttrs.size.normalized})`;
      } else {
        sizeScore = 20;
        sizeMatchLabel = `Alternative Size (${candAttrs.size.normalized})`;
      }
    } else {
      sizeScore = 0;
      sizeMatchLabel = 'Different Pack Format';
    }

    // 6. Price Proximity Scoring
    // Calculate relative price difference
    const targetPrice = Math.max(1, targetAttrs.price);
    const candPrice = candAttrs.price;
    const priceDiff = candPrice - targetPrice;
    const priceDiffAbs = Math.abs(priceDiff);
    const priceDiffRatio = priceDiffAbs / targetPrice;

    // Up to 50 points for identical price, declining with distance
    const priceScore = Math.max(0, 50 - Math.round(priceDiffRatio * 50));

    let priceComparisonLabel = 'Same Price';
    if (priceDiff > 0) {
      priceComparisonLabel = `+Rs. ${priceDiff.toLocaleString()} more`;
    } else if (priceDiff < 0) {
      priceComparisonLabel = `-Rs. ${Math.abs(priceDiff).toLocaleString()} less`;
    }

    // 7. Brand Variety / Affinity
    // Customer needs an alternative brand since original is OOS
    let brandScore = 0;
    const isDifferentBrand = candAttrs.brand.toLowerCase() !== targetAttrs.brand.toLowerCase();
    if (isDifferentBrand) {
      brandScore = 20;
    } else {
      // Same brand (e.g. different size of same brand if available)
      brandScore = 10;
    }

    // 8. Dark Store Stock Abundance
    const stockBonus = Math.min(15, Math.floor(candAttrs.stockCount / 3));

    // 9. Mart Tenant Match
    let tenantBonus = 0;
    if (preferredTenantId && item.tenantId === preferredTenantId) {
      tenantBonus = 15;
    }

    // Total Composite Score
    const totalScore = typeScore + sizeScore + priceScore + brandScore + stockBonus + tenantBonus;

    validCandidates.push({
      ...item,
      substitutionScore: totalScore,
      matchDetails: {
        score: totalScore,
        isExactSizeMatch,
        sizeMatchLabel,
        priceDifference: priceDiff,
        priceComparisonLabel,
        isDifferentBrand,
        targetBrand: targetAttrs.brand,
        candidateBrand: candAttrs.brand,
        productTypeLabel: targetAttrs.productType.label,
        matchedSize: candAttrs.size.normalized
      }
    });
  }

  // Rank candidates descending by score
  validCandidates.sort((a, b) => b.substitutionScore - a.substitutionScore);

  return validCandidates.slice(0, limit);
};

/**
 * Creates a substituted order line item preserving full history
 */
export const createSubstitutedOrderItem = (originalItem, replacementProduct, options = {}) => {
  const origName = originalItem?.name || originalItem?.productName || originalItem?.title || 'Original Product';
  const origPrice = Number(originalItem?.price || 0);
  const origQty = Number(originalItem?.quantity || originalItem?.qty || 1);
  const origId = originalItem?.id || originalItem?._id || originalItem?.productId || 'ORIG-001';
  const origUnit = originalItem?.unit || '1 unit';
  const origImage = originalItem?.image || '';
  const origBrand = originalItem?.brand || extractBrand(originalItem);

  const replacementId = replacementProduct?.id || replacementProduct?._id || origId;
  const replacementName = replacementProduct?.name || 'Substituted Product';
  const replacementPrice = Number(replacementProduct?.price ?? origPrice);
  const replacementUnit = replacementProduct?.unit || origUnit;
  const replacementImage = replacementProduct?.image || origImage;
  const replacementBrand = replacementProduct?.brand || extractBrand(replacementProduct);

  return {
    ...originalItem,
    // Update active item attributes
    id: replacementId,
    productId: replacementId,
    name: replacementName,
    productName: replacementName,
    title: replacementName,
    brand: replacementBrand,
    price: replacementPrice,
    unit: replacementUnit,
    image: replacementImage,
    quantity: origQty,
    // Order substitution audit trail
    isSubstituted: true,
    originalProduct: {
      id: origId,
      name: origName,
      brand: origBrand,
      price: origPrice,
      unit: origUnit,
      image: origImage
    },
    substitutionReason: options.reason || 'Item Out of Stock - Alternative selected with customer approval',
    substitutedAt: options.substitutedAt || new Date().toISOString(),
    substitutedBy: options.substitutedBy || 'Pickup Staff'
  };
};
