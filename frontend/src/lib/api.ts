import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token from cookies
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      
      // Only redirect if we're not already on the login page
      // Don't redirect for /auth/profile endpoint - let AuthContext handle it
      const isAuthEndpoint = error.config?.url?.includes('/auth/profile');
      
      if (!isLoginPage && !isAuthEndpoint) {
        // Clear token only if it's a real authentication failure
        // Don't clear token for profile endpoint - might be a temporary issue
        Cookies.remove('token');
        // Use router.push instead of window.location for better Next.js integration
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

