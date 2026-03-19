import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nestor_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const productApi = {
  getAll: (page = 1, limit = 8, allSearch = false, search = '', brand = 'All', category = 'All') => 
    api.get(`/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&brand=${encodeURIComponent(brand)}&category=${encodeURIComponent(category)}${allSearch ? '&all=true' : ''}`),
  getMetadata: () => api.get('/products/metadata'),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  add: (product) => api.post('/products', product),
  update: (id, product) => api.put(`/products/${id}`, product),
  updateStock: (id, quantity) => api.patch(`/products/${id}/stock`, { quantity }),
  getBrands: () => api.get('/brands'),
  createBrand: (name) => api.post('/brands', { name }),
  getCategories: () => api.get('/categories'),
  createCategory: (name) => api.post('/categories', { name }),
  delete: (id) => api.delete(`/products/${id}`),
};

export const exchangeApi = {
  create: (data) => api.post('/exchanges', data),
  getAll: () => api.get('/exchanges'),
  savePDF: (id, pdfBase64) => api.post(`/exchanges/${id}/pdf`, { pdfBase64 }),
  downloadPDF: (id) => api.get(`/exchanges/${id}/pdf`, { responseType: 'blob' })
};

export const userApi = {
  getAll: () => api.get('/users'),
  add: (user) => api.post('/users', user),
  update: (id, user) => api.put(`/users/${id}`, user),
  delete: (id) => api.delete(`/users/${id}`),
};

export const salesApi = {
  getSaleById: (id) => api.get(`/sales/${id}`),
  createSale: (saleData) => api.post('/sales', saleData),
  getDailyReport: () => api.get('/reports/daily'), // Legacy, but keeping for now
  getDetailedReport: (date) => api.get(`/reports/detailed${date ? `?date=${date}` : ''}`),
  getSummaryReport: (period) => api.get(`/reports/summary?period=${period}`),
  savePDF: (id, pdfBase64) => api.post(`/sales/${id}/pdf`, { pdfBase64 }),
  downloadPDF: (id) => api.get(`/sales/${id}/pdf`, { responseType: 'blob' }),
};

export default api;
