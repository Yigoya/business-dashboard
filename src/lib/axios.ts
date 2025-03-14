import axios from 'axios';
import { getErrorMessage } from './errorUtils';

const api = axios.create({
  // baseURL: 'http://localhost:5000',
  baseURL: 'https://hulumoya2.zapto.org',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Uncomment the request interceptor to ensure the Authorization header is set
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   console.log('Axios interceptor - token available:', !!token);
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;
export { getErrorMessage };