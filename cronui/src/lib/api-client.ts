import { authLib } from './auth';
import type { ApiResponse, PaginatedResponse, ApiError } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8009/api/cronny/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = authLib.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          error: 'Request failed',
          message: response.statusText,
          status: response.status,
        }));
        throw error;
      }

      return await response.json();
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw {
        error: 'Network error',
        message: 'Failed to connect to the server',
        status: 0,
      } as ApiError;
    }
  }

  // Generic CRUD methods
  async list<T>(resource: string, params?: Record<string, string>): Promise<PaginatedResponse<T> | ApiResponse<T[]>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<PaginatedResponse<T> | ApiResponse<T[]>>(`/${resource}${queryString}`);
  }

  async get<T>(resource: string, id: number): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(`/${resource}/${id}`);
  }

  async create<T>(resource: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update<T>(resource: string, id: number, data: Partial<T>): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(`/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(resource: string, id: number): Promise<void> {
    return this.request<void>(`/${resource}/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
