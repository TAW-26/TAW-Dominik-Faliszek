import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';

export function useApi<T>(endpoint: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(endpoint);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Wystąpił nieoczekiwany błąd serwera.');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, setData, loading, error, refetch: fetchData };
}