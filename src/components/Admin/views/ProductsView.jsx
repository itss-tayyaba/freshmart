import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Flame,
  Star,
  Tag,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RefreshCw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';

export const ProductsView = ({ onOpenAddProductModal }) => {
  const {
    currency,
    addToast,
    products,
    categories,
    updateProductInStore,
    deleteProductFromStore,
    bulkUploadProducts,
    clearStoreProducts,
    currentTenant
  } = useStore();
  const [activeFilterTab, setActiveFilterTab] = useState('All');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // CSV Import Modal & Parsing State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvInputMethod, setCsvInputMethod] = useState('file'); // 'file' | 'paste'
  const [csvRawText, setCsvRawText] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [csvReplaceMode, setCsvReplaceMode] = useState(true);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [csvParseErrors, setCsvParseErrors] = useState([]);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    discountPercent: 0,
    category: 'Fruits & Vegetables',
    categoryLabel: 'Fruits & Vegetables',
    stock: 50,
    image: '',
    imageFileName: '',
    inStock: true,
    isFlashDeal: false,
    isBestSeller: false
  });
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Handle open edit product
  const handleOpenEditProduct = (item) => {
    setEditingProduct(item);
    const price = Number(item.price) || 0;
    const discount = Math.max(0, Number(item.discountPercent || 0));
    const origPrice = Number(
      item.originalPrice !== undefined && Number(item.originalPrice) >= price
        ? item.originalPrice
        : discount > 0
        ? Math.round(price / (1 - discount / 100))
        : price
    );

    setEditProductForm({
      name: item.name || '',
      description: item.description || 'Fresh quality grocery product.',
      price: price,
      originalPrice: origPrice,
      discountPercent: discount,
      category: item.category || 'fruits-veg',
      categoryLabel: item.categoryLabel || item.category || 'Fruits & Vegetables',
      stock: item.stock !== undefined ? item.stock : (item.stockCount || 50),
      image: item.image || '',
      imageFileName: '',
      inStock: item.inStock !== false && item.status !== 'Out of Stock',
      isFlashDeal: Boolean(item.isFlashDeal || discount > 0),
      isBestSeller: Boolean(item.isBestSeller)
    });
    setEditImagePreview(item.image);
  };

  // Handle image selection
  const handleEditProductImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
        setEditProductForm((prev) => ({
          ...prev,
          image: reader.result,
          imageFileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save product edits
  const handleSaveProductEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const priceNum = Number(editProductForm.price) || 0;
    const discountNum = Math.max(0, Number(editProductForm.discountPercent || 0));
    const origPriceNum = discountNum > 0
      ? (Number(editProductForm.originalPrice) > priceNum ? Number(editProductForm.originalPrice) : Math.round(priceNum / (1 - discountNum / 100)))
      : priceNum;

    const updated = {
      ...editingProduct,
      name: editProductForm.name,
      description: editProductForm.description,
      price: priceNum,
      originalPrice: origPriceNum,
      discountPercent: discountNum,
      category: editProductForm.category,
      categoryLabel: editProductForm.categoryLabel,
      stock: Number(editProductForm.stock),
      stockCount: Number(editProductForm.stock),
      image: editProductForm.image || editingProduct.image,
      inStock: editProductForm.inStock && Number(editProductForm.stock) > 0,
      isFlashDeal: Boolean(editProductForm.isFlashDeal || discountNum > 0),
      isBestSeller: Boolean(editProductForm.isBestSeller),
      status: !editProductForm.inStock || Number(editProductForm.stock) === 0 ? 'Out of Stock' : Number(editProductForm.stock) < 15 ? 'Low Stock' : 'Active'
    };

    updateProductInStore(updated);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id, name) => {
    deleteProductFromStore(id, name);
  };

  // --- CSV Bulk Upload Engine ---
  const parseCsvString = (text) => {
    if (!text || !text.trim()) return { products: [], errors: ['CSV content is empty'] };

    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return { products: [], errors: ['CSV must have a header row and at least 1 product row'] };
    }

    const parseLine = (line) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]);
    const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[\s_\-"]+/g, ''));

    const headerMap = {};
    headers.forEach((h, idx) => {
      if (['name', 'productname', 'title', 'itemname', 'item'].includes(h)) headerMap.name = idx;
      else if (['price', 'saleprice', 'rate', 'cost'].includes(h)) headerMap.price = idx;
      else if (['originalprice', 'mrp', 'oldprice', 'regularprice', 'listprice'].includes(h)) headerMap.originalPrice = idx;
      else if (['discountpercent', 'discount', 'disc', 'discountpercentage', 'off'].includes(h)) headerMap.discountPercent = idx;
      else if (['category', 'cat', 'catslug', 'categoryid'].includes(h)) headerMap.category = idx;
      else if (['categorylabel', 'categoryname'].includes(h)) headerMap.categoryLabel = idx;
      else if (['unit', 'weight', 'size', 'pack', 'quantityunit'].includes(h)) headerMap.unit = idx;
      else if (['stock', 'qty', 'quantity', 'stockcount', 'inventory'].includes(h)) headerMap.stock = idx;
      else if (['image', 'imageurl', 'pic', 'picture', 'photo', 'img', 'thumbnail'].includes(h)) headerMap.image = idx;
      else if (['brand', 'brandname', 'company', 'manufacturer'].includes(h)) headerMap.brand = idx;
      else if (['description', 'desc', 'details'].includes(h)) headerMap.description = idx;
    });

    if (headerMap.name === undefined || headerMap.price === undefined) {
      return {
        products: [],
        errors: [`Missing required columns. Found headers: [${rawHeaders.join(', ')}]. Expected at least "name" and "price".`]
      };
    }

    const items = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseLine(lines[i]);
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      const name = (row[headerMap.name] || '').replace(/^"|"$/g, '').trim();
      const rawPrice = (row[headerMap.price] || '').replace(/[^0-9.]/g, '');
      const price = Number(rawPrice);

      if (!name || isNaN(price) || price <= 0) {
        errors.push(`Row ${i + 1}: Skipped (missing valid name or price)`);
        continue;
      }

      const rawDiscount = headerMap.discountPercent !== undefined ? (row[headerMap.discountPercent] || '').replace(/[^0-9.]/g, '') : '0';
      const discountPercent = Math.max(0, Math.min(100, Number(rawDiscount) || 0));

      const rawOrig = headerMap.originalPrice !== undefined ? (row[headerMap.originalPrice] || '').replace(/[^0-9.]/g, '') : '';
      const originalPrice = Number(rawOrig) && Number(rawOrig) >= price
        ? Number(rawOrig)
        : discountPercent > 0
        ? Math.round(price / (1 - discountPercent / 100))
        : price;

      const catRaw = (headerMap.category !== undefined ? row[headerMap.category] : 'grocery-staples') || 'grocery-staples';
      const category = catRaw.toLowerCase().replace(/[\s&]+/g, '-').replace(/^"|"$/g, '');
      const categoryLabel = (headerMap.categoryLabel !== undefined ? row[headerMap.categoryLabel] : '') || catRaw;

      const unit = (headerMap.unit !== undefined ? row[headerMap.unit] : '1 unit') || '1 unit';
      const stock = headerMap.stock !== undefined ? Math.max(0, Number(String(row[headerMap.stock]).replace(/[^0-9]/g, '')) || 50) : 50;
      const image = (headerMap.image !== undefined ? row[headerMap.image] : '') || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
      const brand = (headerMap.brand !== undefined ? row[headerMap.brand] : '') || currentTenant?.name || 'FreshMart';
      const description = (headerMap.description !== undefined ? row[headerMap.description] : '') || `${name} - High quality grocery item.`;

      items.push({
        name,
        price,
        originalPrice,
        discountPercent,
        category,
        categoryLabel: categoryLabel.replace(/^"|"$/g, ''),
        unit: unit.replace(/^"|"$/g, ''),
        stock,
        image: image.replace(/^"|"$/g, ''),
        brand: brand.replace(/^"|"$/g, ''),
        description: description.replace(/^"|"$/g, '')
      });
    }

    return { products: items, errors };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setCsvRawText(content);
        const { products: parsed, errors } = parseCsvString(content);
        setParsedProducts(parsed);
        setCsvParseErrors(errors);
        if (parsed.length > 0) {
          addToast('CSV Parsed ✅', `${parsed.length} products ready for import.`);
        } else {
          addToast('Parse Warning ⚠️', 'No valid products found. Check column headers.', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePasteTextChange = (text) => {
    setCsvRawText(text);
    if (!text.trim()) {
      setParsedProducts([]);
      setCsvParseErrors([]);
      return;
    }
    const { products: parsed, errors } = parseCsvString(text);
    setParsedProducts(parsed);
    setCsvParseErrors(errors);
  };

  const handleConfirmCsvImport = () => {
    if (parsedProducts.length === 0) {
      addToast('No Products ⚠️', 'Please upload or paste valid CSV product rows first.', 'error');
      return;
    }
    if (bulkUploadProducts) {
      bulkUploadProducts(parsedProducts, csvReplaceMode);
    }
    setIsCsvModalOpen(false);
    setParsedProducts([]);
    setCsvRawText('');
    setCsvFileName('');
  };

  const handleDownloadCsvTemplate = () => {
    const templateRows = [
      'name,price,originalPrice,discountPercent,category,categoryLabel,unit,stock,image,brand,description',
      'Farm Fresh Red Apples,290,340,15,fruits-veg,Fruits & Vegetables,1 Kg,45,https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80,FreshMart Farms,Crisp and juicy farm-harvested red apples rich in vitamins.',
      'Super Basmati Kernel Rice,480,550,13,grocery-staples,Grocery Staples,1 Kg,80,https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80,Guard Rice,Aged long-grain aromatic basmati rice for biryani and pulao.',
      'Organic Farm Milk,220,240,8,dairy-eggs,Dairy & Eggs,1 Litre,60,https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80,Pure Dairy,Fresh pasteurized whole cow milk delivered chilled.',
      'Fresh Farm Eggs (12 Pack),360,400,10,dairy-eggs,Dairy & Eggs,12 Eggs,40,https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80,Sunny Farms,Nutritious brown organic free-range farm eggs.',
      'Fresh Yellow Bananas,180,200,10,fruits-veg,Fruits & Vegetables,1 Dozen,35,https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80,Sindh Harvest,Naturally ripened sweet bananas packed with potassium.',
      'Artisan Whole Wheat Bread,190,220,14,bakery,Bakery,400g,30,https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80,Daily Bakehouse,Soft high-fiber stoneground whole wheat loaf.',
      'Pure Spring Mineral Water,90,100,10,beverages,Beverages,1.5 Litre,100,https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80,AquaPure,Natural spring mineral water bottled at source.',
      'Crunchy Potato Wafers,110,130,15,snacks,Snacks & Munchies,110g,50,https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80,Crispy Bites,Salted golden potato chips kettle cooked to perfection.'
    ];
    const csvContent = '\uFEFF' + templateRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'freshmart_products_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Template Downloaded! 📥', 'Use freshmart_products_template.csv to add your items.');
  };

  const handleClearCatalog = () => {
    if (clearStoreProducts) {
      clearStoreProducts('current');
    }
    setIsClearConfirmOpen(false);
  };

  const filtered = products.filter((p) => {
    const status = p.status || (p.inStock ? (p.stock < 15 ? 'Low Stock' : 'Active') : 'Out of Stock');
    if (activeFilterTab === 'Active' && status !== 'Active') return false;
    if (activeFilterTab === 'Out of Stock' && status !== 'Out of Stock') return false;
    if (activeFilterTab === 'Low Stock' && status !== 'Low Stock') return false;
    if (categoryFilter !== 'All' && p.category !== categoryFilter && p.categoryLabel !== categoryFilter) return false;
    if (search.trim()) {
      return (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.categoryLabel && p.categoryLabel.toLowerCase().includes(search.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header: Products & Live Discounts + CSV & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Products & Live Discounts</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              🏬 {currentTenant?.name || 'Store'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Control pricing, landing page showcase badges, discounts and stock</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleDownloadCsvTemplate}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Download sample CSV template with all columns and working image links"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Template</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setParsedProducts([]);
              setCsvParseErrors([]);
              setCsvRawText('');
              setCsvFileName('');
              setCsvReplaceMode(products.length === 0);
              setIsCsvModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            title="Bulk import products from CSV file or pasted text"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>

          {products.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Remove all products from this catalog"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear Items</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddProductModal}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4">
        
        {/* Search Bar + Category Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search products by name, brand, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-none cursor-pointer w-full sm:w-48"
            >
              <option value="All">All Categories</option>
              <option value="fruits-veg">Fruits & Vegetables</option>
              <option value="dairy-eggs">Dairy & Eggs</option>
              <option value="meat-poultry">Meat & Poultry</option>
              <option value="beverages">Beverages</option>
              <option value="snacks">Snacks & Munchies</option>
              <option value="grocery-staples">Grocery Staples</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
          {[
            { label: 'All', count: products.length },
            { label: 'Active', count: products.filter(p => p.status !== 'Out of Stock').length },
            { label: 'Out of Stock', count: products.filter(p => p.status === 'Out of Stock').length },
            { label: 'Low Stock', count: products.filter(p => p.status === 'Low Stock' || p.stock < 15).length }
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveFilterTab(tab.label)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                activeFilterTab === tab.label
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 pb-3">
                <th className="pb-3 font-semibold">Product</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Price & Discount</th>
                <th className="pb-3 font-semibold">Stock</th>
                <th className="pb-3 font-semibold">Landing Page Badges</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item) => {
                const status = item.status || (item.inStock ? (item.stock < 15 ? 'Low Stock' : 'Active') : 'Out of Stock');

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{item.unit || '1 unit'} • {item.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600 font-medium">{item.categoryLabel || item.category}</td>
                    <td className="py-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-slate-900">{currency.symbol}{item.price}</span>
                        {item.originalPrice > item.price && (
                          <span className="text-[10px] text-slate-400 line-through">{currency.symbol}{item.originalPrice}</span>
                        )}
                        {item.discountPercent > 0 && (
                          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                            -{item.discountPercent}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-slate-700">{item.stock || item.stockCount || 50} units</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.isFlashDeal && (
                          <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Flash Deal
                          </span>
                        )}
                        {item.isBestSeller && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                            Bestseller
                          </span>
                        )}
                        {!item.isFlashDeal && !item.isBestSeller && (
                          <span className="text-[10px] text-slate-400 font-semibold">Standard</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-slate-400">
                        <button
                          onClick={() => handleOpenEditProduct(item)}
                          className="p-1.5 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                          title="Edit product, discounts & image"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(item.id, item.name)}
                          className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
                📦
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                {products.length === 0 ? `No Products in ${currentTenant?.name || 'Store'} Catalog` : 'No matching products found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {products.length === 0
                  ? `This supermarket catalog currently has 0 items. Upload a CSV file with your product names, prices, stock, and pictures to start selling immediately.`
                  : 'Try clearing your search keyword, adjusting your category, or selecting a different status filter.'}
              </p>
              {products.length === 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedProducts([]);
                      setCsvParseErrors([]);
                      setCsvRawText('');
                      setCsvFileName('');
                      setCsvReplaceMode(true);
                      setIsCsvModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Upload Products CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAddProductModal}
                    className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Single Product</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Edit Product Modal with Full Landing Page & Discount Controls */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 font-serif">Edit Product & Showcase</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4 text-sm">
              
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Product Name</label>
                <input
                  type="text"
                  required
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Description</label>
                <textarea
                  rows={2}
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 text-xs font-medium resize-y"
                />
              </div>

              {/* Price, Original Price & Discount Percentage */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Sale Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editProductForm.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newPrice = Number(val);
                      const orig = Number(editProductForm.originalPrice || newPrice);
                      const disc = orig > newPrice && orig > 0 ? Math.round(((orig - newPrice) / orig) * 100) : 0;
                      setEditProductForm({ ...editProductForm, price: val, discountPercent: disc });
                    }}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2 text-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Original Price (Rs.)</label>
                  <input
                    type="number"
                    min="1"
                    value={editProductForm.originalPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newOrig = Number(val);
                      const disc = Number(editProductForm.discountPercent || 0);
                      let newPrice = Number(editProductForm.price);
                      if (disc > 0 && newOrig > 0) {
                        newPrice = Math.round(newOrig * (1 - disc / 100));
                      }
                      setEditProductForm({
                        ...editProductForm,
                        originalPrice: val,
                        price: disc > 0 && newPrice > 0 ? newPrice : editProductForm.price
                      });
                    }}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2 text-slate-800 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Discount (% OFF)</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={editProductForm.discountPercent}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setEditProductForm({ ...editProductForm, discountPercent: '' });
                        return;
                      }
                      const disc = Math.max(0, Math.min(99, Number(val)));
                      const orig = Number(editProductForm.originalPrice || editProductForm.price || 0);
                      const newPrice = orig > 0 ? Math.round(orig * (1 - disc / 100)) : editProductForm.price;
                      setEditProductForm({
                        ...editProductForm,
                        discountPercent: disc,
                        price: newPrice > 0 ? newPrice : editProductForm.price
                      });
                    }}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2 text-rose-600 text-xs font-black"
                  />
                </div>
              </div>

              {/* Category & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Category</label>
                  <select
                    value={editProductForm.category}
                    onChange={(e) => {
                      const sel = e.target.value;
                      const matched = (categories || []).find((c) => c.id === sel || c.name === sel);
                      setEditProductForm({
                        ...editProductForm,
                        category: sel,
                        categoryLabel: matched ? matched.name : sel
                      });
                    }}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2 text-slate-800 text-xs font-medium cursor-pointer"
                  >
                    {(categories || []).map((cat) => (
                      <option key={cat.id || cat._id || cat.name} value={cat.id || cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Stock Units</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editProductForm.stock}
                    onChange={(e) => setEditProductForm({ ...editProductForm, stock: e.target.value })}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2 text-slate-800 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Image Picker */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Item Picture</label>
                <div className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                  <label className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-lg shadow-2xs cursor-pointer inline-flex items-center gap-1.5 shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditProductImageChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-600 truncate font-mono">
                    {editProductForm.imageFileName || 'Change image (optional)'}
                  </span>
                </div>

                {editImagePreview && (
                  <div className="mt-2.5 flex items-center gap-3 p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <img
                      src={editImagePreview}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover bg-white shadow-2xs border border-emerald-200"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-800 block">Current Picture</span>
                      <span className="text-[11px] text-emerald-600">Updated across storefront & landing page</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Landing Page Showcase Checkboxes */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <span className="font-black text-slate-800 block">Landing Page & Showcase Controls:</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editProductForm.isFlashDeal}
                      onChange={(e) => setEditProductForm({ ...editProductForm, isFlashDeal: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 cursor-pointer"
                    />
                    <span>🔥 Show in Flash Deals</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editProductForm.isBestSeller}
                      onChange={(e) => setEditProductForm({ ...editProductForm, isBestSeller: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                    />
                    <span>⭐ Show in Bestsellers</span>
                  </label>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Save Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 📤 CSV BULK UPLOAD MODAL */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] flex flex-col border border-slate-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-black shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">Bulk Upload Products via CSV</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Import prices, discounts, stock, categories and pictures for <strong className="text-slate-800">{currentTenant?.name || 'Store'}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              
              {/* Method Tabs: File vs Paste */}
              <div className="flex items-center justify-between gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCsvInputMethod('file')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    csvInputMethod === 'file'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>📁 Upload .CSV File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCsvInputMethod('paste')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    csvInputMethod === 'paste'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>✍️ Paste CSV Text</span>
                </button>
              </div>

              {/* File Input Tab */}
              {csvInputMethod === 'file' ? (
                <div className="space-y-3">
                  <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group">
                    <input
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-xs mb-2 group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {csvFileName ? `Selected: ${csvFileName}` : 'Click to Browse or Drag & Drop CSV'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">Supports standard CSV files (.csv, .txt) with image URLs</span>
                  </label>

                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>Need a starting file with correct columns?</span>
                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Sample CSV Template</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Paste Text Tab */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <label className="font-bold">Paste CSV Rows (including header):</label>
                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      <Download className="w-3 h-3" />
                      <span>Get Sample Template</span>
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={csvRawText}
                    onChange={(e) => handlePasteTextChange(e.target.value)}
                    placeholder={`name,price,originalPrice,discountPercent,category,categoryLabel,unit,stock,image,brand,description\nFarm Fresh Red Apples,290,340,15,fruits-veg,Fruits & Vegetables,1 Kg,50,https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80,FreshMart,Fresh crisp apples`}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>
              )}

              {/* Mode Toggle: Replace vs Append */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-black text-slate-800 block">Catalog Import Mode:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    onClick={() => setCsvReplaceMode(true)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      csvReplaceMode ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={csvReplaceMode}
                      onChange={() => setCsvReplaceMode(true)}
                      className="text-emerald-600"
                    />
                    <div>
                      <div className="leading-tight">Replace Existing Catalog</div>
                      <div className="text-[10px] text-slate-500 font-normal">Wipes previous items and sets new ones</div>
                    </div>
                  </label>

                  <label
                    onClick={() => setCsvReplaceMode(false)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      !csvReplaceMode ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={!csvReplaceMode}
                      onChange={() => setCsvReplaceMode(false)}
                      className="text-emerald-600"
                    />
                    <div>
                      <div className="leading-tight">Append to Catalog</div>
                      <div className="text-[10px] text-slate-500 font-normal">Adds alongside current items</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Parse Warnings / Errors */}
              {csvParseErrors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Import Warnings ({csvParseErrors.length})</span>
                  </div>
                  <div className="text-[11px] text-amber-800 max-h-20 overflow-y-auto space-y-0.5 font-mono">
                    {csvParseErrors.map((err, i) => (
                      <div key={i}>&bull; {err}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedProducts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{parsedProducts.length} Products Successfully Detected</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Previewing first 5 rows</span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0">
                        <tr>
                          <th className="p-2">Picture</th>
                          <th className="p-2">Product Name</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Price</th>
                          <th className="p-2">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedProducts.slice(0, 5).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80';
                                }}
                              />
                            </td>
                            <td className="p-2 font-bold text-slate-800 max-w-[150px] truncate">{p.name}</td>
                            <td className="p-2 text-slate-500">{p.categoryLabel || p.category}</td>
                            <td className="p-2 font-bold text-emerald-700">
                              {currency.symbol}{p.price}
                              {p.discountPercent > 0 && (
                                <span className="ml-1 text-[9px] text-rose-600 bg-rose-50 px-1 py-0.5 rounded">
                                  -{p.discountPercent}%
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-slate-600">{p.stock} ({p.unit})</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmCsvImport}
                  disabled={parsedProducts.length === 0}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    parsedProducts.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    Import {parsedProducts.length > 0 ? `${parsedProducts.length} Products` : 'Products'} into {currentTenant?.name?.split(' ')[0] || 'Store'}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 🗑️ CLEAR CATALOG CONFIRMATION MODAL */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 border border-slate-100 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
              <Trash2 className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Clear All Products in this Catalog?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                This will remove all <strong className="text-slate-800">{products.length} products</strong> currently listed under <strong className="text-slate-800">{currentTenant?.name || 'Store'}</strong>. You can then upload a new CSV file to populate the store.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Keep Products
              </button>
              <button
                type="button"
                onClick={handleClearCatalog}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Yes, Clear All Items
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
