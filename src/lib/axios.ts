import axios from 'axios';
import { getErrorMessage } from './errorUtils';

export const API_URL = "https://hulumoya.zapto.org" 
// export const API_URL = 'http://localhost:5000' 
export const API_URL_FILE = `${API_URL}/uploads/`

const api = axios.create({
  baseURL: API_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers = config.headers ?? {};
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
//       localStorage.removeItem('token');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

export default api;
export { getErrorMessage };