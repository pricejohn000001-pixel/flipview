// src/utils/api.js
import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: process.env.BACKEND_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.REACT_APP_API_TOKEN}`, // Optional auth
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor (optional)
api.interceptors.request.use(
  (config) => {
    // You can modify headers here, e.g., add auth token dynamically
    // const token = localStorage.getItem("token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (optional)
api.interceptors.response.use(
  (response) => response.data, // return only the data
  (error) => {
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

// Generic CRUD methods
export const apiGet = (url, params) => api.get(url, { params });
export const apiPost = (url, data) => api.post(url, data);
export const apiPut = (url, data) => api.put(url, data);
export const apiPatch = (url, data) => api.patch(url, data);
export const apiDelete = (url) => api.delete(url);

export default api;
