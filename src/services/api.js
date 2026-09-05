const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

const getAuthHeaders = (extraHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  try {
    const token =
      localStorage.getItem('freshmart_admin_token') ||
      localStorage.getItem('freshmart_token') ||
      localStorage.getItem('freshmart_jwt') ||
      localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {}
  return headers;
};

const handleResponse = async (res) => {
  try {
    const data = await res.json();
    return data;
  } catch (e) {
    return { success: false, message: 'Invalid JSON from server' };
  }
};

export const apiService = {
  // Health check
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return await handleResponse(res);
    } catch (e) {
      return { status: 'Offline / In-Memory Mock' };
    }
  },

  // Products API
  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/products?${query}`);
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getProductById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async createProduct(productData) {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async updateProduct(id, productData) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async deleteProduct(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Categories API
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async createCategory(categoryData) {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData)
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async updateCategory(id, categoryData) {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData)
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async deleteCategory(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Orders API
  async createOrder(orderPayload) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderPayload)
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getOrders() {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async trackOrder(orderId) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/track/${encodeURIComponent(orderId)}`);
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async updateOrderStatus(id, status) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Coupons / Promotions API
  async validateCoupon(code, cartSubtotal) {
    try {
      const res = await fetch(`${API_BASE_URL}/promotions/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartSubtotal })
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Analytics & Admin
  async getAnalytics() {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getInventory() {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async restockProduct(id, amount) {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${id}/restock`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount })
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getDeliveries() {
    try {
      const res = await fetch(`${API_BASE_URL}/delivery`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Auth API
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async register(userData) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Customers API
  async getCustomers() {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async createCustomer(customerData) {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(customerData)
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Suppliers API
  async getSuppliers() {
    try {
      const res = await fetch(`${API_BASE_URL}/suppliers`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async createSupplier(supplierData) {
    try {
      const res = await fetch(`${API_BASE_URL}/suppliers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(supplierData)
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async deleteSupplier(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Riders API
  async getRiders() {
    try {
      const res = await fetch(`${API_BASE_URL}/riders`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async createRider(riderData) {
    try {
      const res = await fetch(`${API_BASE_URL}/riders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(riderData)
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async deleteRider(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/riders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async clearAllRiders() {
    try {
      const res = await fetch(`${API_BASE_URL}/riders`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
