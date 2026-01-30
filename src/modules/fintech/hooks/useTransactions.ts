import { useState, useCallback, useEffect, useRef } from 'react';
import type { 
  Transaction, 
  TransactionSearchParams, 
  PaginatedResponse,
  LoadingState 
} from '../types';
import { transactionService } from '../services';
import { CONFIG } from '../constants';

interface UseTransactionsResult {
  transactions: Transaction[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  loading: LoadingState;
  searchParams: TransactionSearchParams;
  setSearchParams: (params: TransactionSearchParams) => void;
  goToPage: (page: number) => void;
  refresh: () => void;
  getTransactionById: (id: string) => Promise<Transaction | null>;
}

export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchParams, setSearchParams] = useState<TransactionSearchParams>({});
  const [page, setPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
    retryCount: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchRef = useRef<((params: TransactionSearchParams, pageNum: number, retryCount?: number) => Promise<void>) | null>(null);

  const fetchTransactions = useCallback(async (
    params: TransactionSearchParams,
    pageNum: number,
    retryCount: number = 0
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading({ isLoading: true, error: null, retryCount });

    try {
      const result: PaginatedResponse<Transaction> = await transactionService.searchTransactions(
        params,
        pageNum,
        CONFIG.PAGE_SIZE
      );

      setTransactions(result.data);
      setPaginationInfo({
        total: result.total,
        totalPages: result.totalPages,
      });
      setLoading({ isLoading: false, error: null, retryCount: 0 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
      
      if (retryCount < CONFIG.MAX_RETRIES) {
        setTimeout(() => {
          fetchRef.current?.(params, pageNum, retryCount + 1);
        }, CONFIG.RETRY_DELAY * Math.pow(2, retryCount));
      } else {
        setLoading({ isLoading: false, error: message, retryCount });
      }
    }
  }, []);

  useEffect(() => {
    fetchRef.current = fetchTransactions;
  }, [fetchTransactions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions(searchParams, page);
    }, 0);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchParams, page, fetchTransactions]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= paginationInfo.totalPages) {
      setPage(newPage);
    }
  }, [paginationInfo.totalPages]);

  const refresh = useCallback(() => {
    fetchTransactions(searchParams, page);
  }, [fetchTransactions, searchParams, page]);

  const getTransactionById = useCallback(async (id: string): Promise<Transaction | null> => {
    return transactionService.getTransactionById(id);
  }, []);

  const handleSetSearchParams = useCallback((params: TransactionSearchParams) => {
    setSearchParams(params);
    setPage(1);
  }, []);

  return {
    transactions,
    pagination: {
      page,
      pageSize: CONFIG.PAGE_SIZE,
      ...paginationInfo,
    },
    loading,
    searchParams,
    setSearchParams: handleSetSearchParams,
    goToPage,
    refresh,
    getTransactionById,
  };
}
