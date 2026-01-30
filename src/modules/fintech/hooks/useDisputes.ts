import { useState, useCallback, useEffect } from 'react';
import type { 
  Dispute, 
  DisputeStatus, 
  DisputeFormData,
  PaginatedResponse,
  LoadingState 
} from '../types';
import { disputeService } from '../services';
import { useAuth } from '../context';
import { CONFIG } from '../constants';

interface UseDisputesResult {
  disputes: Dispute[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  loading: LoadingState;
  statusCounts: Record<DisputeStatus, number>;
  statusFilter: DisputeStatus | null;
  setStatusFilter: (status: DisputeStatus | null) => void;
  goToPage: (page: number) => void;
  refresh: () => void;
  createDispute: (data: DisputeFormData) => Promise<Dispute>;
  getDisputeById: (id: string) => Promise<Dispute | null>;
}

export function useDisputes(): UseDisputesResult {
  const { currentUser } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | null>(null);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
    retryCount: 0,
  });
  const [statusCounts, setStatusCounts] = useState<Record<DisputeStatus, number>>({
    draft: 0,
    created: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    settled: 0,
  });

  const fetchDisputes = useCallback(async (pageNum: number, status: DisputeStatus | null) => {
    setLoading({ isLoading: true, error: null, retryCount: 0 });

    try {
      const result: PaginatedResponse<Dispute> = await disputeService.getDisputes(
        pageNum,
        CONFIG.PAGE_SIZE,
        status ? { status } : undefined
      );

      setDisputes(result.data);
      setPaginationInfo({
        total: result.total,
        totalPages: result.totalPages,
      });
      setStatusCounts(disputeService.getDisputeCountByStatus());
      setLoading({ isLoading: false, error: null, retryCount: 0 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch disputes';
      setLoading({ isLoading: false, error: message, retryCount: 0 });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDisputes(page, statusFilter);
    }, 0);
    return () => clearTimeout(timer);
  }, [page, statusFilter, fetchDisputes]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= paginationInfo.totalPages) {
      setPage(newPage);
    }
  }, [paginationInfo.totalPages]);

  const refresh = useCallback(() => {
    fetchDisputes(page, statusFilter);
  }, [fetchDisputes, page, statusFilter]);

  const createDispute = useCallback(async (data: DisputeFormData): Promise<Dispute> => {
    const dispute = await disputeService.createDispute(data, currentUser.id);
    refresh();
    return dispute;
  }, [currentUser.id, refresh]);

  const getDisputeById = useCallback(async (id: string): Promise<Dispute | null> => {
    return disputeService.getDisputeById(id);
  }, []);

  const handleSetStatusFilter = useCallback((status: DisputeStatus | null) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  return {
    disputes,
    pagination: {
      page,
      pageSize: CONFIG.PAGE_SIZE,
      ...paginationInfo,
    },
    loading,
    statusCounts,
    statusFilter,
    setStatusFilter: handleSetStatusFilter,
    goToPage,
    refresh,
    createDispute,
    getDisputeById,
  };
}
