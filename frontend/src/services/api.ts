import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization header from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔍 [api.ts] Token added to request:', token.substring(0, 30) + '...');
    } else {
      console.log('🔍 [api.ts] No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ [api.ts] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('❌ [api.ts] Response error:', error.response?.status, error.response?.data);
    
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      // In dev mode, just log but don't auto-logout to help debugging
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log('⚠️ [api.ts] 401 received - NOT auto-logouting in DEV mode for debugging');
        // Don't logout in dev - let the user see the actual error
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        // Use window.location only if we're not already on the login page to avoid loops
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
