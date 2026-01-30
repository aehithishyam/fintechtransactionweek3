import { useState, useCallback, useEffect } from 'react';
import type { AuditLogEntry, AuditAction } from '../types';
import { auditService } from '../services';

interface UseAuditLogResult {
  entries: readonly AuditLogEntry[];
  isLoading: boolean;
  error: string | null;
  loadDisputeAuditLog: (disputeId: string) => Promise<void>;
  loadAllLogs: (page?: number) => Promise<void>;
  filterByAction: (action: AuditAction) => Promise<void>;
  filterByDateRange: (start: Date, end: Date) => Promise<void>;
  exportLog: (disputeId?: string) => Promise<string>;
  stats: {
    totalEntries: number;
    entriesByAction: Record<string, number>;
    entriesByActor: Record<string, number>;
  };
}

export function useAuditLog(disputeId?: string): UseAuditLogResult {
  const [entries, setEntries] = useState<readonly AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalEntries: 0,
    entriesByAction: {} as Record<string, number>,
    entriesByActor: {} as Record<string, number>,
  });

  const loadDisputeAuditLog = useCallback(async (dispId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const logs = await auditService.getDisputeAuditLog(dispId);
      setEntries(logs);
      setStats(auditService.getAuditStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAllLogs = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const { entries: logs } = await auditService.getAllAuditLogs(page);
      setEntries(logs);
      setStats(auditService.getAuditStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterByAction = useCallback(async (action: AuditAction) => {
    setIsLoading(true);
    setError(null);
    try {
      const logs = await auditService.getAuditLogsByAction(action);
      setEntries(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to filter audit logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterByDateRange = useCallback(async (start: Date, end: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const logs = await auditService.getAuditLogsByDateRange(start.getTime(), end.getTime());
      setEntries(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to filter audit logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportLog = useCallback(async (dispId?: string): Promise<string> => {
    return auditService.exportAuditLog(dispId);
  }, []);

  useEffect(() => {
    if (disputeId) {
      loadDisputeAuditLog(disputeId);
    }
  }, [disputeId, loadDisputeAuditLog]);

  return {
    entries,
    isLoading,
    error,
    loadDisputeAuditLog,
    loadAllLogs,
    filterByAction,
    filterByDateRange,
    exportLog,
    stats,
  };
}
