import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { FreshMartHeader } from './components/Header/FreshMartHeader';
import { FreshMartHome } from './components/Home/FreshMartHome';
import { ShopPage } from './components/Shop/ShopPage';
import { DealsPage } from './components/Deals/DealsPage';
import { DeliveryPage } from './components/Delivery/DeliveryPage';
import { ProductDetailPage } from './components/ProductDetail/ProductDetailPage';
import { CheckoutPage } from './components/Checkout/CheckoutPage';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { RecipesPage } from './components/Recipes/RecipesPage';
import { CustomerPortal } from './components/CustomerPortal/CustomerPortal';
import { DeliveryPortal } from './components/DeliveryPortal/DeliveryPortal';
import { Footer } from './components/Footer/Footer';


// Modals
import { CartDrawer } from './components/Modals/CartDrawer';
import { WishlistDrawer } from './components/Modals/WishlistDrawer';
import { OrderTrackerModal } from './components/Modals/OrderTrackerModal';
import { OffersModal } from './components/Modals/OffersModal';
import { QuickViewModal } from './components/Products/QuickViewModal';
import { LocationModal } from './components/Stores/LocationModal';
import { AuthModal } from './components/Modals/AuthModal';
import { VendorRegistrationModal } from './components/VendorPortal/VendorRegistrationModal';
import { ToastContainer } from './components/Modals/ToastContainer';


function FreshMartAppContent() {
  const { currentPage, isVendorRegisterOpen, setIsVendorRegisterOpen } = useStore();

  // If in Admin / Vendor Dashboard view, render the dedicated full-screen admin/vendor experience
  if (currentPage === 'admin' || currentPage === 'vendor' || currentPage === 'vendor-portal' || currentPage === 'delivery-portal') {
    return (
      <div className="min-h-screen bg-slate-100 font-sans">
        <AdminDashboard />
        <ToastContainer />
      </div>
    );
  }

  // If in Customer Portal view, render the dedicated customer dashboard experience
  if (currentPage === 'customer-portal') {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans">
        <CustomerPortal />
        <CartDrawer />
        <WishlistDrawer />
        <LocationModal />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans antialiased text-slate-800">
      {/* Top Header & Navigation Bar */}
      <FreshMartHeader />

      {/* Main Page View Switching */}
      <main className="flex-1">
        {currentPage === 'home' && <FreshMartHome />}
        {currentPage === 'shop' && <ShopPage />}
        {currentPage === 'deals' && <DealsPage />}
        {currentPage === 'delivery' && <DeliveryPage />}
        {currentPage === 'product-detail' && <ProductDetailPage />}
        {currentPage === 'checkout' && <CheckoutPage />}
        {currentPage === 'recipes' && <RecipesPage />}
      </main>




      {/* Footer */}
      <Footer />

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <WishlistDrawer />
      <OrderTrackerModal />
      <OffersModal />
      <QuickViewModal />
      <LocationModal />
      <AuthModal />
      <VendorRegistrationModal isOpen={isVendorRegisterOpen} onClose={() => setIsVendorRegisterOpen(false)} />
      <ToastContainer />
    </div>

  );
}

export default function App() {
  return (
    <StoreProvider>
      <FreshMartAppContent />
    </StoreProvider>
  );
}
