import axios from 'axios';
import { Action } from './action.service';

const API_URL = 'http://localhost:8009';
const API_PREFIX = '/api/cronny/v1';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL + API_PREFIX,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to add the JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Check if the error is due to token expiration
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const exp = payload.exp * 1000; // Convert to milliseconds
          if (Date.now() >= exp) {
            // Token is expired, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        } catch (err) {
          // If we can't parse the token, it's invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

interface ApiResponse<T> {
  actions: T;
  message: string;
}

// Actions API
export const actionsApi = {
  getActions: () => api.get<ApiResponse<Action[]>>('/actions'),
  getAction: (id: number) => api.get<ApiResponse<Action>>(`/actions/${id}`),
  createAction: (data: Partial<Action>) => api.post<ApiResponse<Action>>('/actions', data),
  updateAction: (id: number, data: Partial<Action>) => api.put<ApiResponse<Action>>(`/actions/${id}`, data),
  deleteAction: (id: number) => api.delete<ApiResponse<void>>(`/actions/${id}`),
};

export default api;