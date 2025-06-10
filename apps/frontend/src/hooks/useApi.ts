import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiOptions {
  immediate?: boolean;
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions = {}
) {
  const { immediate = true } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiFunction();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('An error occurred');
      setState((prev) => ({ ...prev, loading: false, error: err }));
      throw err;
    }
  }, [apiFunction]);

  useEffect(() => {
    if (immediate) {
      execute().catch((error) => {
        // Let API parameter errors bubble up while still handling in state
        if (error.message?.includes('Missing required parameter')) {
          // Rethrow to let error handling capture it
          setTimeout(() => { throw error; }, 0);
        }
      });
    }
  }, [execute, immediate]);

  return {
    ...state,
    refetch: execute,
  };
}

export function useApiMutation<TData, TVariables = void>(
  apiFunction: (variables: TVariables) => Promise<TData>
) {
  const [state, setState] = useState<UseApiState<TData>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await apiFunction(variables);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('An error occurred');
        setState((prev) => ({ ...prev, loading: false, error: err }));
        throw err;
      }
    },
    [apiFunction]
  );

  return {
    ...state,
    mutate,
    reset: () => setState({ data: null, loading: false, error: null }),
  };
}
