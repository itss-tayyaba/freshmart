// Category & Product Categorization Helper
// Ensures strict differentiation between Beverages, Dry Foods, Cooking Oils, Dairy, etc.
// Guarantees that clicking Beverages or Dry Foods/Food NEVER shows Cooking Oil.

export const isOilProduct = (p) => {
  if (!p) return false;
  const name = String(p.name || '').toLowerCase();
  const cat = String(p.category || '').toLowerCase();
  const catLabel = String(p.categoryLabel || '').toLowerCase();
  const deptId = String(p.departmentId || '').toLowerCase();
  const deptName = String(p.departmentName || '').toLowerCase();

  return (
    cat === 'oil-ghee' ||
    cat === 'oil' ||
    cat === 'cooking-oils' ||
    cat === 'edible-oils' ||
    deptId.includes('-oil') ||
    deptName.includes('oil') ||
    catLabel.includes('oil') ||
    catLabel.includes('ghee') ||
    name.includes('cooking oil') ||
    name.includes('olive oil') ||
    name.includes('canola oil') ||
    name.includes('mustard oil') ||
    name.includes('banaspati') ||
    name.includes('pure ghee') ||
    name.includes('edible oil')
  );
};

export const isBeverageProduct = (p) => {
  if (!p) return false;
  if (isOilProduct(p)) return false;

  const name = String(p.name || '').toLowerCase();
  const cat = String(p.category || '').toLowerCase();
  const catLabel = String(p.categoryLabel || '').toLowerCase();
  const deptId = String(p.departmentId || '').toLowerCase();
  const deptName = String(p.departmentName || '').toLowerCase();

  return (
    cat === 'beverages' ||
    cat === 'beverage' ||
    cat === 'drinks' ||
    catLabel.includes('beverage') ||
    catLabel.includes('drink') ||
    deptId.includes('beverage') ||
    deptName.includes('beverage') ||
    deptName.includes('drink') ||
    deptName.includes('tea') ||
    deptName.includes('coffee') ||
    name.includes('tea') ||
    name.includes('coffee') ||
    name.includes('juice') ||
    name.includes('water') ||
    name.includes('drink') ||
    name.includes('sharbat') ||
    name.includes('soda') ||
    name.includes('cola')
  );
};

export const isDryFoodProduct = (p) => {
  if (!p) return false;
  if (isOilProduct(p)) return false;
  if (isBeverageProduct(p)) return false;

  const name = String(p.name || '').toLowerCase();
  const cat = String(p.category || '').toLowerCase();
  const catLabel = String(p.categoryLabel || '').toLowerCase();
  const deptId = String(p.departmentId || '').toLowerCase();
  const deptName = String(p.departmentName || '').toLowerCase();

  return (
    cat === 'dry-foods' ||
    cat === 'dry-food' ||
    cat === 'dry_foods' ||
    cat === 'grocery-staples' ||
    cat === 'staples' ||
    cat === 'grains' ||
    cat === 'pulses' ||
    catLabel.includes('dry food') ||
    catLabel.includes('staple') ||
    catLabel.includes('grain') ||
    deptId.includes('staple') ||
    deptId.includes('pantry') ||
    deptId.includes('dryfood') ||
    deptName.includes('staple') ||
    deptName.includes('grain') ||
    deptName.includes('pantry') ||
    name.includes('rice') ||
    name.includes('atta') ||
    name.includes('flour') ||
    name.includes('daal') ||
    name.includes('lentil') ||
    name.includes('sugar') ||
    name.includes('masala') ||
    name.includes('spice') ||
    name.includes('chili') ||
    name.includes('almond') ||
    name.includes('dry fruit') ||
    name.includes('nuts') ||
    name.includes('grain') ||
    name.includes('pulse')
  );
};

/**
 * Robust Category Matching Function
 * Correctly routes 'beverage', 'food', 'dyr foods', 'dry foods', 'oil', etc.
 */
export const matchesProductCategory = (p, targetCategory) => {
  if (!targetCategory || targetCategory === 'all') return true;
  if (!p) return false;

  const rawTarget = String(targetCategory).toLowerCase().trim();

  // Normalize target
  const target = rawTarget
    .replace(/^dept-[a-z]+-/, '') // strip department prefix if present, e.g. dept-af-beverages -> beverages
    .replace(/^(alfatah|chasevalue|chaseup|freshmart)-/, ''); // strip brand prefix

  // 1. BEVERAGES
  if (
    target === 'beverage' ||
    target === 'beverages' ||
    target === 'drinks' ||
    target.includes('beverage') ||
    rawTarget.includes('beverage')
  ) {
    return isBeverageProduct(p);
  }

  // 2. DRY FOODS / FOOD / STAPLES (supports 'food', 'dyr foods', 'dry foods', 'dry food', etc.)
  if (
    target === 'dry-foods' ||
    target === 'dry-food' ||
    target === 'dry foods' ||
    target === 'dry food' ||
    target === 'dyr foods' ||
    target === 'dyr food' ||
    target === 'dry' ||
    target === 'food' ||
    target === 'foods' ||
    target === 'grocery-staples' ||
    target === 'staples' ||
    target === 'pantry' ||
    rawTarget.includes('staples') ||
    rawTarget.includes('dryfood') ||
    rawTarget.includes('pantry')
  ) {
    // Return dry foods, NEVER oil
    return isDryFoodProduct(p);
  }

  // 3. COOKING OIL & GHEE
  if (
    target === 'oil' ||
    target === 'oils' ||
    target === 'oil-ghee' ||
    target === 'cooking-oil' ||
    target === 'cooking-oils' ||
    target === 'edible-oils' ||
    target.includes('oil') ||
    target.includes('ghee') ||
    rawTarget.includes('oil')
  ) {
    return isOilProduct(p);
  }

  // 4. DAIRY & EGGS
  if (
    target === 'dairy-eggs' ||
    target === 'dairy' ||
    target.includes('dairy') ||
    target.includes('milk') ||
    rawTarget.includes('dairy')
  ) {
    return (
      (p.category === 'dairy-eggs' || String(p.categoryLabel || '').toLowerCase().includes('dairy')) &&
      !isOilProduct(p)
    );
  }

  // 5. FRUITS & VEGETABLES
  if (
    target === 'fruits-veg' ||
    target === 'vegetables' ||
    target === 'fruits' ||
    target.includes('veg') ||
    target.includes('fruit') ||
    rawTarget.includes('produce')
  ) {
    return (
      (p.category === 'fruits-veg' ||
        String(p.categoryLabel || '').toLowerCase().includes('fruit') ||
        String(p.categoryLabel || '').toLowerCase().includes('vegetable')) &&
      !isOilProduct(p)
    );
  }

  // 6. SNACKS & CONFECTIONERY
  if (
    target === 'snacks' ||
    target === 'biscuit' ||
    target.includes('snack') ||
    target.includes('chocolate') ||
    rawTarget.includes('snacks')
  ) {
    return (
      (p.category === 'snacks' || String(p.categoryLabel || '').toLowerCase().includes('snack')) &&
      !isOilProduct(p)
    );
  }

  // 7. MEAT & POULTRY
  if (
    target === 'meat-poultry' ||
    target === 'meat' ||
    target.includes('meat') ||
    target.includes('poultry') ||
    rawTarget.includes('meat')
  ) {
    return (
      (p.category === 'meat-poultry' || String(p.categoryLabel || '').toLowerCase().includes('meat')) &&
      !isOilProduct(p)
    );
  }

  // 8. HOUSEHOLD / CLEANING
  if (
    target === 'household' ||
    target === 'cleaning' ||
    target.includes('clean') ||
    target.includes('house') ||
    rawTarget.includes('household')
  ) {
    return (
      (p.category === 'household' || String(p.categoryLabel || '').toLowerCase().includes('clean')) &&
      !isOilProduct(p)
    );
  }

  // Direct ID / Slug comparison fallback
  const pCat = String(p.category || '').toLowerCase().trim();
  const pCatLabel = String(p.categoryLabel || '').toLowerCase().trim();
  const pDeptId = String(p.departmentId || '').toLowerCase().trim();
  const pDeptName = String(p.departmentName || '').toLowerCase().trim();

  return (
    pCat === rawTarget ||
    pCatLabel === rawTarget ||
    pDeptId === rawTarget ||
    pDeptName === rawTarget ||
    (rawTarget.includes(pCat) && pCat.length > 2) ||
    (pCat.includes(rawTarget) && rawTarget.length > 2) ||
    (rawTarget.includes(pDeptId) && pDeptId.length > 2) ||
    (pDeptId.includes(rawTarget) && rawTarget.length > 2)
  );
};

/**
 * Filter categories list to only those that have active products in the store.
 * Returns array of category objects that are available.
 */
export const getAvailableCategories = (productsList = [], categoriesList = []) => {
  if (!Array.isArray(productsList) || productsList.length === 0) return [];

  // If categoriesList is provided, filter it
  if (Array.isArray(categoriesList) && categoriesList.length > 0) {
    return categoriesList.filter((cat) => {
      const catKey = cat.id || cat.slug || cat.departmentId || cat.name;
      return productsList.some((p) => matchesProductCategory(p, catKey));
    });
  }

  // Otherwise, automatically derive distinct available categories from products
  const categoryMap = new Map();
  productsList.forEach((p) => {
    let catId = p.category || 'general';
    let catName = p.categoryLabel || 'General';

    if (isOilProduct(p)) {
      catId = 'oil-ghee';
      catName = 'Cooking Oil & Ghee';
    } else if (isBeverageProduct(p)) {
      catId = 'beverages';
      catName = 'Beverages';
    } else if (isDryFoodProduct(p)) {
      catId = 'dry-foods';
      catName = 'Dry Foods & Staples';
    }

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        id: catId,
        slug: catId,
        name: catName,
        count: 1
      });
    } else {
      categoryMap.get(catId).count += 1;
    }
  });

  return Array.from(categoryMap.values());
};
