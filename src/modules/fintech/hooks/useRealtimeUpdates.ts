import { useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeEvent, ConflictInfo, Dispute } from '../types';
import { realtimeService } from '../services';

interface UseRealtimeUpdatesResult {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
  conflicts: ConflictInfo[];
  connect: () => void;
  disconnect: () => void; 
  subscribeToDispute: (disputeId: string, callback: (event: RealtimeEvent) => void) => () => void;
  resolveConflict: (disputeId: string, resolution: 'keep_local' | 'use_server') => void;
  clearConflicts: () => void;
}

export function useRealtimeUpdates(): UseRealtimeUpdatesResult {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    realtimeService.connect();
    setIsConnected(true);

    unsubscribeRef.current = realtimeService.subscribeAll((event) => {
      setLastEvent(event);

      if (event.type === 'conflict_detected') {
        const conflictInfo: ConflictInfo = {
          disputeId: event.disputeId,
          localVersion: 0,
          serverVersion: event.payload.serverVersion as number,
          serverData: event.payload.serverData as Partial<Dispute>,
          conflictedFields: Object.keys(event.payload.serverData as Record<string, unknown>),
        };
        setConflicts(prev => [...prev, conflictInfo]);
      }
      if (event.type === 'dispute_status_changed') {
        // trigger refresh from parent later
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    realtimeService.disconnect();
    setIsConnected(false);
  }, []);

  const subscribeToDispute = useCallback((
    disputeId: string,
    callback: (event: RealtimeEvent) => void
  ): (() => void) => {
    return realtimeService.subscribe(disputeId, callback);
  }, []);

  const resolveConflict = useCallback((
    disputeId: string,
    resolution: 'keep_local' | 'use_server'
  ) => {
    void resolution;
    setConflicts(prev => prev.filter(c => c.disputeId !== disputeId));
  }, []);

  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      connect();
    }, 0);
    return () => {
      clearTimeout(timer);
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isConnected,
    lastEvent,
    conflicts,
    connect,
    disconnect,
    subscribeToDispute,
    resolveConflict,
    clearConflicts,
  };
}

