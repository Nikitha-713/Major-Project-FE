import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', 
});

// --- THE MAGIC FIX: Automatically attach the token to EVERY request ---
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('unfazed_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getErrorMessage = (err) => {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.errors?.[0]?.msg) return err.response.data.errors[0].msg;
  return err.message || 'Something went wrong';
};

// Interceptor to catch Module 7 gates (Triggers the Upgrade Popup)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.code === 'UPGRADE_REQUIRED') {
      window.dispatchEvent(new CustomEvent('upgrade-required', { 
        detail: { message: error.response.data.message } 
      }));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;