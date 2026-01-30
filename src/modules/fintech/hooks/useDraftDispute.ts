import { useState, useCallback, useEffect, useRef } from 'react';
import type { DisputeDraft, DisputeFormData } from '../types';
import { disputeService, auditService } from '../services';
import { useAuth } from '../context';
import type { DraftStatus } from '../types';

// type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';
 
interface UseDraftDisputeResult {
  drafts: DisputeDraft[];
  currentDraft: DisputeDraft | null;
  isSaving: boolean;
  lastSaved: number | null;
  status: DraftStatus;
  saveDraft: (transactionId: string, data: Partial<DisputeFormData>) => Promise<void>;
  loadDraft: (draftId: string) => Promise<DisputeDraft | null>;
  deleteDraft: (draftId: string) => Promise<void>;
  clearCurrentDraft: () => void;
  // resumeDraft: (draft: DisputeDraft) => void;
  startNewDraft: () => void;
  getDraftByTransactionId: (transactionId: string) => DisputeDraft | null;
}

export function useDraftDispute(): UseDraftDisputeResult {
  const { currentUser } = useAuth();
  const [drafts, setDrafts] = useState<DisputeDraft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<DisputeDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [status, setStatus] = useState<DraftStatus>('idle');
  
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<{ transactionId: string; data: Partial<DisputeFormData> } | null>(null);

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const existingDrafts = await disputeService.getDrafts();
        setDrafts(existingDrafts);
      } catch (error) {
        console.error('Failed to load drafts:', error);
      }
    };
    loadDrafts();
  }, []);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const saveDraft = useCallback(async (transactionId: string, data: Partial<DisputeFormData>) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    pendingDataRef.current = { transactionId, data };

    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!pendingDataRef.current) return;

      setIsSaving(true);
      setStatus('saving');
      try {
        const savedDraft = await disputeService.saveDraft(
          pendingDataRef.current.data,
          0,
          currentDraft?.id
        );

        setCurrentDraft(savedDraft);
        setLastSaved(Date.now());
        setStatus('saved');

        await auditService.logAction(
          savedDraft.id,
          'draft_saved',
          { id: currentUser.id, name: currentUser.name, role: currentUser.role },
          { transactionId: pendingDataRef.current.transactionId }
        );

        const existingDrafts = await disputeService.getDrafts();
        setDrafts(existingDrafts);

        pendingDataRef.current = null;
      } catch (error) {
        console.error('Failed to save draft:', error);
        setStatus('error');
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  }, [currentDraft?.id, currentUser]);

  const loadDraft = useCallback(async (draftId: string): Promise<DisputeDraft | null> => {
    try {
      const draft = await disputeService.getDraftById(draftId);
      if (draft) {
        setCurrentDraft(draft);
        
        await auditService.logAction(
          draftId,
          'draft_resumed',
          { id: currentUser.id, name: currentUser.name, role: currentUser.role },
          { step: draft.step }
        );
      }
      return draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [currentUser]);

  const deleteDraft = useCallback(async (draftId: string) => {
    try {
      await disputeService.deleteDraft(draftId);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      if (currentDraft?.id === draftId) {
        setCurrentDraft(null);
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }, [currentDraft?.id]);

  const clearCurrentDraft = useCallback(() => {
    setCurrentDraft(null);
    setLastSaved(null);
  }, []);

  // const resumeDraft = useCallback((draft: DisputeDraft) => {
  //   setCurrentDraft(draft);
  // }, []);

  const startNewDraft = useCallback(() => {
    setCurrentDraft(null);
    setLastSaved(null);
  }, []);

  const getDraftByTransactionId = useCallback(
    (transactionId: string): DisputeDraft | null => {
      return (
        drafts.find(d => d.data?.transactionId === transactionId) || null
      );
    },
    [drafts]
  );

  return {
    drafts,
    currentDraft,
    isSaving,
    lastSaved,
    status,
    saveDraft,
    loadDraft,
    deleteDraft,
    clearCurrentDraft,
    // resumeDraft,
    startNewDraft,
    getDraftByTransactionId,
  };
}

