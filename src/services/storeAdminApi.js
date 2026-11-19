// Super-admin calls for store admins + polygon suggestion.
// (Standalone file so it never overwrites your existing src/services/api.js.)
const getBase = () => {
  const isLocal = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const envUrl = import.meta.env?.VITE_API_URL;
  if (isLocal && envUrl && !envUrl.includes('localhost')) return envUrl.replace(/\/$/, '');
  return typeof window !== 'undefined' && !isLocal ? `${window.location.origin}/api` : '/api';
};

const headers = () => {
  const h = { 'Content-Type': 'application/json' };
  try {
    const token =
      localStorage.getItem('freshmart_admin_token') ||
      localStorage.getItem('freshmart_token') ||
      localStorage.getItem('freshmart_jwt') ||
      localStorage.getItem('token');
    if (token) h.Authorization = `Bearer ${token}`;
  } catch (e) {
    /* storage unavailable */
  }
  return h;
};

const call = async (path, options = {}) => {
  const res = await fetch(`${getBase()}${path}`, { headers: headers(), ...options });
  return res.json();
};

export const storeAdminApi = {
  list: () => call('/admin/store-admins'),
  create: (storeId, body = {}) => call(`/admin/stores/${encodeURIComponent(storeId)}/admin`, { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (storeId) => call(`/admin/stores/${encodeURIComponent(storeId)}/admin/reset-password`, { method: 'POST', body: '{}' }),
  suggestZone: (lat, lng) => call(`/admin/suggest-zone?lat=${lat}&lng=${lng}`)
};
