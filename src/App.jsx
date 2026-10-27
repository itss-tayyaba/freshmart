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
import { AdminLogin } from './components/Admin/AdminLogin';
import { RecipesPage } from './components/Recipes/RecipesPage';
import { CustomerPortal } from './components/CustomerPortal/CustomerPortal';
import { DeliveryPortal } from './components/DeliveryPortal/DeliveryPortal';
import { PickupStaffPortal } from './components/Admin/views/PickupStaffPortal';
import { Footer } from './components/Footer/Footer';


// Modals
import { CartDrawer } from './components/Modals/CartDrawer';
import { FloatingCartPill } from './components/Cart/FloatingCartPill';
import { WishlistDrawer } from './components/Modals/WishlistDrawer';
import { OrderTrackerModal } from './components/Modals/OrderTrackerModal';
import { OffersModal } from './components/Modals/OffersModal';
import { QuickViewModal } from './components/Products/QuickViewModal';
import { LocationModal } from './components/Stores/LocationModal';
import { AuthModal } from './components/Modals/AuthModal';
import { VendorRegistrationModal } from './components/VendorPortal/VendorRegistrationModal';
import { ToastContainer } from './components/Modals/ToastContainer';


function FreshMartAppContent() {
  const { currentPage, isVendorRegisterOpen, setIsVendorRegisterOpen, user, adminRole, isAdminLoggedIn } = useStore();

  // If in dedicated Login view, render the multi-role staff/rider/admin login console
  if (currentPage === 'login' || currentPage === 'signin') {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#0b0f19] dark:text-slate-100 font-sans">
        <AdminLogin />
      </div>
    );
  }

  // If in Admin / Vendor Dashboard view, render the dedicated full-screen admin/vendor experience
  if (currentPage === 'admin' || currentPage === 'vendor' || currentPage === 'vendor-portal') {
    return (
      <div className="min-h-screen w-full bg-slate-100 dark:bg-[#0b0f19] dark:text-slate-100 font-sans">
        <AdminDashboard />
      </div>
    );
  }

  // If in Delivery / Rider Portal view, render the dedicated courier dashboard experience
  if (currentPage === 'delivery-portal' || currentPage === 'rider-portal') {
    const isRiderAuthorized = isAdminLoggedIn && user && ['rider', 'admin', 'superadmin'].includes((user.role || adminRole || '').toLowerCase());
    if (!isRiderAuthorized) {
      return (
        <div className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#0b0f19] dark:text-slate-100 font-sans">
          <AdminLogin />
        </div>
      );
    }
    return (
      <div className="min-h-screen w-full bg-[#fbf9f4] dark:bg-[#0b0f19] dark:text-slate-100 font-sans">
        <DeliveryPortal />
      </div>
    );
  }

  // If in Pickup Staff Portal view, render the dedicated packing station experience
  if (currentPage === 'pickup-staff' || currentPage === 'pickup-portal' || currentPage === 'staff-portal') {
    const isStaffAuthorized = isAdminLoggedIn && user && ['pickup_staff', 'admin', 'superadmin'].includes((user.role || adminRole || '').toLowerCase());
    if (!isStaffAuthorized) {
      return (
        <div className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#0b0f19] dark:text-slate-100 font-sans">
          <AdminLogin />
        </div>
      );
    }
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#0b0f19] dark:text-slate-100 font-sans">
        <PickupStaffPortal />
      </div>
    );
  }

  // If in Customer Portal view, render the dedicated customer dashboard experience
  if (currentPage === 'customer-portal') {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] dark:text-slate-100 font-sans">
        <CustomerPortal />
        <CartDrawer />
        <FloatingCartPill />
        <WishlistDrawer />
        <LocationModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#0b0f19] font-sans antialiased text-slate-800 dark:text-slate-100 w-full max-w-full overflow-x-hidden">
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
      <FloatingCartPill />
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
