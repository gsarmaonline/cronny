import { authLib } from './auth';
import type { ApiResponse, PaginatedResponse, ApiError } from '@/types';
import { mockApiData, mockApiResponse, mockPaginatedResponse } from './mock-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8009/api/cronny/v1';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

class ApiClient {
  private baseUrl: string;
  private useMockData: boolean;

  constructor(baseUrl: string = API_BASE_URL, useMockData: boolean = USE_MOCK_DATA) {
    this.baseUrl = baseUrl;
    this.useMockData = useMockData;
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
    if (this.useMockData && resource in mockApiData) {
      await this.mockDelay();
      const data = mockApiData[resource as keyof typeof mockApiData] as T[];
      return mockApiResponse(data);
    }
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<PaginatedResponse<T> | ApiResponse<T[]>>(`/${resource}${queryString}`);
  }

  async get<T>(resource: string, id: number): Promise<ApiResponse<T>> {
    if (this.useMockData && resource in mockApiData) {
      await this.mockDelay();
      const data = mockApiData[resource as keyof typeof mockApiData] as T[];
      const item = data.find((item: any) => item.id === id);
      if (!item) {
        throw { error: 'Not found', message: 'Item not found', status: 404 } as ApiError;
      }
      return mockApiResponse(item);
    }
    return this.request<ApiResponse<T>>(`/${resource}/${id}`);
  }

  async create<T>(resource: string, data: Partial<T>): Promise<ApiResponse<T>> {
    if (this.useMockData) {
      await this.mockDelay();
      const newItem = { ...data, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as T;
      return mockApiResponse(newItem);
    }
    return this.request<ApiResponse<T>>(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update<T>(resource: string, id: number, data: Partial<T>): Promise<ApiResponse<T>> {
    if (this.useMockData) {
      await this.mockDelay();
      const updatedItem = { ...data, id, updated_at: new Date().toISOString() } as T;
      return mockApiResponse(updatedItem);
    }
    return this.request<ApiResponse<T>>(`/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(resource: string, id: number): Promise<void> {
    if (this.useMockData) {
      await this.mockDelay();
      return;
    }
    return this.request<void>(`/${resource}/${id}`, {
      method: 'DELETE',
    });
  }

  private async mockDelay(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

export const apiClient = new ApiClient();
