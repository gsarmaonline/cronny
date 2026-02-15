import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse, PaginatedResponse, ApiError } from '@/types';

interface UseCrudOptions<T> {
  resource: string;
  autoFetch?: boolean;
}

interface UseCrudReturn<T> {
  items: T[];
  loading: boolean;
  error: ApiError | null;
  fetchList: () => Promise<void>;
  fetchOne: (id: number) => Promise<T | null>;
  create: (data: Partial<T>) => Promise<T | null>;
  update: (id: number, data: Partial<T>) => Promise<T | null>;
  remove: (id: number) => Promise<boolean>;
}

export function useCrud<T>({ resource, autoFetch = true }: UseCrudOptions<T>): UseCrudReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.list<T>(resource);

      // Handle both paginated and non-paginated responses
      const data = 'data' in response ? response.data : [];
      setItems(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, [resource]);

  const fetchOne = useCallback(async (id: number): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<T>(resource, id);
      return response.data;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [resource]);

  const create = useCallback(async (data: Partial<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.create<T>(resource, data);
      await fetchList(); // Refresh the list
      return response.data;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [resource, fetchList]);

  const update = useCallback(async (id: number, data: Partial<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.update<T>(resource, id, data);
      await fetchList(); // Refresh the list
      return response.data;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [resource, fetchList]);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(resource, id);
      await fetchList(); // Refresh the list
      return true;
    } catch (err) {
      setError(err as ApiError);
      return false;
    } finally {
      setLoading(false);
    }
  }, [resource, fetchList]);

  useEffect(() => {
    if (autoFetch) {
      fetchList();
    }
  }, [autoFetch, fetchList]);

  return {
    items,
    loading,
    error,
    fetchList,
    fetchOne,
    create,
    update,
    remove,
  };
}
