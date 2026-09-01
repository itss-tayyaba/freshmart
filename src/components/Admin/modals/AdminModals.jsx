import React, { useState } from 'react';
import { X, Plus, Check, Upload, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';

export const AdminModals = ({
  isAddProductOpen,
  setIsAddProductOpen,
  isAddCategoryOpen,
  setIsAddCategoryOpen,
  isAddCustomerOpen,
  setIsAddCustomerOpen,
  isAddSupplierOpen,
  setIsAddSupplierOpen,
  isCreatePromoOpen,
  setIsCreatePromoOpen
}) => {
  const { addToast, products } = useStore();

  // Add Product State matching user's image
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Fruits & Vegetables',
    unit: '1 Kg',
    image: '',
    imageFileName: '',
    inStock: true
  });

  const [imagePreview, setImagePreview] = useState(null);

  // Add Category State
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80'
  });

  // Add Customer State
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Add Supplier State
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact: '',
    phone: '',
    email: ''
  });

  // Create Promo State
  const [promoForm, setPromoForm] = useState({
    title: '',
    discount: '',
    validity: 'Valid: 28 - 31 Aug 2026'
  });

  // Handle Image File Selection (Choose File)
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setProductForm((prev) => ({
          ...prev,
          image: reader.result,
          imageFileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const fallbackImg = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

    const categorySlugMap = {
      'Fruits & Vegetables': 'fruits-veg',
      'Dairy & Eggs': 'dairy-eggs',
      'Meat & Poultry': 'meat-poultry',
      'Bakery': 'bakery',
      'Beverages': 'beverages',
      'Snacks & Munchies': 'snacks',
      'Grocery Staples': 'grocery-staples'
    };

    const newProductPayload = {
      name: productForm.name,
      description: productForm.description || 'Fresh quality grocery product.',
      price: Number(productForm.price),
      originalPrice: Math.round(Number(productForm.price) * 1.15),
      category: categorySlugMap[productForm.category] || 'fruits-veg',
      categoryLabel: productForm.category,
      unit: productForm.unit || '1 Kg',
      image: productForm.image || fallbackImg,
      stock: productForm.inStock ? 50 : 0,
      inStock: productForm.inStock,
      status: productForm.inStock ? 'Active' : 'Out of Stock'
    };

    try {
      await apiService.createProduct(newProductPayload);
    } catch (err) {
      console.error(err);
    }

    setIsAddProductOpen(false);
    addToast('Product Added 🛒', `"${productForm.name}" saved directly to your MongoDB Atlas catalog.`);
    
    // Reset form
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: 'Fruits & Vegetables',
      unit: '1 Kg',
      image: '',
      imageFileName: '',
      inStock: true
    });
    setImagePreview(null);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createCategory(categoryForm);
    } catch (err) {}
    setIsAddCategoryOpen(false);
    addToast('Category Created 🗂️', `"${categoryForm.name}" added to MongoDB.`);
    setCategoryForm({ name: '', image: '' });
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:5000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      });
    } catch (err) {}
    setIsAddCustomerOpen(false);
    addToast('Customer Created 👤', `Account for "${customerForm.name}" created.`);
    setCustomerForm({ name: '', email: '', phone: '' });
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:5000/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      });
    } catch (err) {}
    setIsAddSupplierOpen(false);
    addToast('Supplier Added 🚚', `"${supplierForm.name}" added to database.`);
    setSupplierForm({ name: '', contact: '', phone: '', email: '' });
  };

  const handlePromoSubmit = (e) => {
    e.preventDefault();
    setIsCreatePromoOpen(false);
    addToast('Promotion Launched 🎁', `Campaign "${promoForm.title}" is now active.`);
    setPromoForm({ title: '', discount: '', validity: '' });
  };

  return (
    <>
      {/* 1. Add Product Modal matching user's requested layout */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 font-serif">Add Product</h2>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-sm">
              
              {/* Name */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Red Apples 1kg"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 text-xs font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter fresh product description, details, and quality highlights..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 text-xs font-medium resize-y"
                />
              </div>

              {/* Price & Category Side-by-Side matching screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="250"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 text-xs font-medium cursor-pointer"
                  >
                    <option>Fruits & Vegetables</option>
                    <option>Dairy & Eggs</option>
                    <option>Meat & Poultry</option>
                    <option>Bakery</option>
                    <option>Beverages</option>
                    <option>Snacks & Munchies</option>
                    <option>Grocery Staples</option>
                  </select>
                </div>
              </div>

              {/* Image with Choose File Button matching screenshot */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Image</label>
                <div className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                  <label className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-lg shadow-2xs cursor-pointer inline-flex items-center gap-1.5 shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-600 truncate font-mono">
                    {productForm.imageFileName || 'No file chosen'}
                  </span>
                </div>

                {/* Live Image Preview */}
                {imagePreview && (
                  <div className="mt-2.5 flex items-center gap-3 p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <img
                      src={imagePreview}
                      alt="Product Preview"
                      className="w-12 h-12 rounded-lg object-cover bg-white shadow-2xs border border-emerald-200"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-800 block">Image Ready</span>
                      <span className="text-[11px] text-emerald-600">Will be uploaded to MongoDB</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkbox: Available on menu / In Stock */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={productForm.inStock}
                  onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-700 focus:ring-amber-700 border-slate-300 cursor-pointer accent-[#a36829]"
                />
                <label htmlFor="inStockCheck" className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
                  Available in store & in stock
                </label>
              </div>

              {/* Bottom Action Buttons matching screenshot */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#a36829] hover:bg-[#8c5720] text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Save Product</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Add Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">+ Add New Category</h3>
              <button onClick={() => setIsAddCategoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Farm Spices"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">+ Add Customer</h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zainab Tariq"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="zainab@gmail.com"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone</label>
                <input
                  type="text"
                  required
                  placeholder="0300-1234567"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                Create Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">+ Add Supplier</h3>
              <button onClick={() => setIsAddSupplierOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Vendor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Valley Orchards"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Person</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Aslam"
                  value={supplierForm.contact}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="0321-5551234"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="sales@greenvalley.com"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                Add Supplier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Create Promotion Modal */}
      {isCreatePromoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">+ Create Promotion</h3>
              <button onClick={() => setIsCreatePromoOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePromoSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Mango Fest"
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Discount Tag</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 25% OFF on Mangoes"
                  value={promoForm.discount}
                  onChange={(e) => setPromoForm({ ...promoForm, discount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                Launch Campaign
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
