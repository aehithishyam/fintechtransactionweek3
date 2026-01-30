import { useState, useCallback } from 'react';
import type { Dispute, DisputeStatus, AuditAction } from '../types';
import { disputeService, auditService } from '../services';
import { useAuth } from '../context';
import { STATUS_TRANSITIONS } from '../constants';

interface WorkflowResult {
  success: boolean;
  dispute?: Dispute;
  error?: string;
  conflict?: boolean;
}

interface UseDisputeWorkflowResult { 
  isProcessing: boolean;
  lastError: string | null;
  canTransition: (dispute: Dispute, targetStatus: DisputeStatus) => boolean;
  getAvailableTransitions: (dispute: Dispute) => DisputeStatus[];
  submitForReview: (dispute: Dispute) => Promise<WorkflowResult>;
  approve: (dispute: Dispute, approvedAmount?: number, notes?: string) => Promise<WorkflowResult>;
  reject: (dispute: Dispute, notes: string) => Promise<WorkflowResult>;
  settle: (dispute: Dispute, notes?: string) => Promise<WorkflowResult>;
  assignTo: (dispute: Dispute, assigneeId: string) => Promise<WorkflowResult>;
  reopen: (dispute: Dispute) => Promise<WorkflowResult>;
}

export function useDisputeWorkflow(): UseDisputeWorkflowResult {
  const { currentUser, hasPermission } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const canTransition = useCallback((dispute: Dispute, targetStatus: DisputeStatus): boolean => {
    const transition = STATUS_TRANSITIONS[dispute.status];
    if (!transition) return false;

    if (!transition.nextStatuses.includes(targetStatus)) return false;

    if (!transition.allowedRoles.includes(currentUser.role)) return false;

    switch (targetStatus) {
      case 'approved':
        return hasPermission('approve_dispute');
      case 'rejected':
        return hasPermission('reject_dispute');
      case 'settled':
        return hasPermission('settle_dispute');
      case 'under_review':
        return hasPermission('review_dispute');
      default:
        return true;
    }
  }, [currentUser.role, hasPermission]);

  const getAvailableTransitions = useCallback((dispute: Dispute): DisputeStatus[] => {
    const transition = STATUS_TRANSITIONS[dispute.status];
    if (!transition) return [];

    return transition.nextStatuses.filter(status => canTransition(dispute, status));
  }, [canTransition]);

  const performTransition = useCallback(async (
    dispute: Dispute,
    newStatus: DisputeStatus,
    action: AuditAction,
    notes?: string,
    approvedAmount?: number
  ): Promise<WorkflowResult> => {
    setIsProcessing(true);
    setLastError(null);

    try {
      const result = await disputeService.changeStatus(
        dispute.id,
        newStatus,
        currentUser.id,
        notes,
        approvedAmount,
        dispute.version
      );

      if (result.conflict) {
        setLastError('Conflict detected: Another user has modified this dispute');
        return { success: false, error: 'Conflict detected', conflict: true, dispute: result.dispute };
      }

      // const finalAmount =
      //   newStatus === 'settled'
      //     ? dispute.approvedAmount
      //     : approvedAmount;
      // details audit
      await auditService.logAction(
        dispute.id,
        action,
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        },
        {
          notes,
          // approvedAmount: finalAmount,
          fromStatus: dispute.status,
          toStatus: newStatus,
          transactionId: dispute.transactionId,
        },

        dispute.status,
        newStatus
      );


      setIsProcessing(false);
      return { success: true, dispute: result.dispute };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Operation failed';
      setLastError(message);
      setIsProcessing(false);
      return { success: false, error: message };
    }
  }, [currentUser]);

  const submitForReview = useCallback(async (dispute: Dispute): Promise<WorkflowResult> => {
    if (dispute.status !== 'created') {
      return { success: false, error: 'Dispute must be in Created status' };
    }
    return performTransition(dispute, 'under_review', 'status_changed');
  }, [performTransition]);

  const approve = useCallback(async (
    dispute: Dispute, 
    approvedAmount?: number, 
    notes?: string
  ): Promise<WorkflowResult> => {
    if (dispute.status !== 'under_review') {
      return { success: false, error: 'Dispute must be Under Review' };
    }
    return performTransition(dispute, 'approved', 'dispute_approved', notes, approvedAmount);
  }, [performTransition]);

  const reject = useCallback(async (dispute: Dispute, notes: string): Promise<WorkflowResult> => {
    if (dispute.status !== 'under_review') {
      return { success: false, error: 'Dispute must be Under Review' };
    }
    if (!notes.trim()) {
      return { success: false, error: 'Rejection notes are required' };
    }
    return performTransition(dispute, 'rejected', 'dispute_rejected', notes);
  }, [performTransition]);

  const settle = useCallback(async (dispute: Dispute, notes?: string): Promise<WorkflowResult> => {
    if (dispute.status !== 'approved') {
      return { success: false, error: 'Dispute must be Approved before settling' };
    }
    return performTransition(dispute, 'settled', 'dispute_settled', notes);
  }, [performTransition]);

  const assignTo = useCallback(async (dispute: Dispute, assigneeId: string): Promise<WorkflowResult> => {
    setIsProcessing(true);
    setLastError(null);

    try {
      const updated = await disputeService.assignDispute(dispute.id, assigneeId);
      
      await auditService.logAction(
        dispute.id,
        'dispute_assigned',
        { id: currentUser.id, name: currentUser.name, role: currentUser.role },
        { assigneeId },
        dispute.assignedTo,
        assigneeId
      );

      setIsProcessing(false);
      return { success: true, dispute: updated };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign dispute';
      setLastError(message);
      setIsProcessing(false);
      return { success: false, error: message };
    }
  }, [currentUser]);

  const reopen = useCallback(async (dispute: Dispute): Promise<WorkflowResult> => {
    if (dispute.status !== 'rejected') {
      return { success: false, error: 'Only rejected disputes can be reopened' };
    }
    return performTransition(dispute, 'under_review', 'status_changed', 'Dispute reopened for review');
  }, [performTransition]);

  return {
    isProcessing,
    lastError,
    canTransition,
    getAvailableTransitions,
    submitForReview,
    approve,
    reject,
    settle,
    assignTo,
    reopen,
  };
}

