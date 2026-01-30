import { useState, useCallback, useRef } from 'react';
import type { OptimisticUpdate } from '../types';
import { CONFIG } from '../constants';

interface UseOptimisticUpdateResult<T> {
  optimisticData: T | null;
  isOptimistic: boolean;
  isPending: boolean;
  error: string | null;
  applyOptimistic: (
    original: T,
    optimistic: T,
    serverAction: () => Promise<T>
  ) => Promise<{ success: boolean; data?: T; error?: string }>;
  rollback: () => void;
  confirm: (serverData: T) => void;
}

export function useOptimisticUpdate<T extends { id: string }>(): UseOptimisticUpdateResult<T> {
  const [state, setState] = useState<OptimisticUpdate<T> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyOptimistic = useCallback(async (
    original: T,
    optimistic: T,
    serverAction: () => Promise<T>
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setState({
      id: original.id,
      originalData: original,
      optimisticData: optimistic,
      status: 'pending',
    });

    timeoutRef.current = setTimeout(() => {
      setState(prev => {
        if (prev?.status === 'pending') {
          return {
            ...prev,
            status: 'failed',
            error: 'Operation timed out',
          };
        }
        return prev;
      });
    }, CONFIG.OPTIMISTIC_TIMEOUT);

    try {
      const serverData = await serverAction();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setState({
        id: serverData.id,
        originalData: original,
        optimisticData: serverData,
        status: 'success',
      });

      setTimeout(() => {
        setState(null);
      }, 100);

      return { success: true, data: serverData };
    } catch (error) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const errorMessage = error instanceof Error ? error.message : 'Operation failed';

      setState({
        id: original.id,
        originalData: original,
        optimisticData: original,
        status: 'failed',
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }, []);

  const rollback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState(null);
  }, []);

  const confirm = useCallback((serverData: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({
      id: serverData.id,
      originalData: serverData,
      optimisticData: serverData,
      status: 'success',
    });
    setTimeout(() => setState(null), 100);
  }, []);

  return {
    optimisticData: state?.optimisticData || null,
    isOptimistic: state?.status === 'pending',
    isPending: state?.status === 'pending',
    error: state?.error || null,
    applyOptimistic,
    rollback,
    confirm,
  };
}
