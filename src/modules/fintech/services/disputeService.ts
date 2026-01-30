import type { 
  Dispute, 
  DisputeDraft, 
  DisputeFormData, 
  DisputeStatus, 
  PaginatedResponse
} from '../types';
import { transactionService } from './transactionService';
import { auditService } from './auditService';

function mapDisputeToTransactionStatus(status: DisputeStatus) {
  switch (status) {
    case 'created':
    case 'under_review':
      return 'disputed';
    case 'approved':
      return 'refunded';
    case 'rejected':
      return 'completed';
    case 'settled':
      return 'refunded';
    default:
      return undefined;
  }
}

let disputes: Dispute[] = [];
let drafts: DisputeDraft[] = [];
let disputeIdCounter = 1;
let draftIdCounter = 1;

class DisputeService {
  // private simulateDelay(): Promise<void> {
  //   return new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  // }

  // private simulateFailure(): boolean {
  //   return Math.random() < 0.03;
  // }
  private simulateDelay(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return Promise.resolve();
    }
    return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
  }

  private simulateFailure(): boolean {
    if (process.env.NODE_ENV === 'test') {
      return false;
    }
    return Math.random() < 0.05;
  }

  async createDispute(
    data: DisputeFormData, 
    createdById: string,
    isDraft: boolean = false
  ): Promise<Dispute> {
    await this.simulateDelay();

    if (this.simulateFailure()) {
      throw new Error('Network error: Failed to create dispute');
    }

    const transaction = await transactionService.getTransactionById(data.transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    await transactionService.updateTransactionStatus(
      data.transactionId,
      'disputed'
    );

    const now = Date.now();
    const dispute: Dispute = {
      id: `DSP-${String(disputeIdCounter++).padStart(6, '0')}`,
      transactionId: data.transactionId,
      transaction,
      status: isDraft ? 'draft' : 'created',
      reason: data.reason,
      reasonCode: data.reason,
      category: 'other',
      priority: data.priority,
      description: data.description,
      originalAmount: transaction.amount,
      requestedAmount: data.requestedAmount,
      claimedAmount: data.requestedAmount,
      currency: transaction.currency,
      evidence: data.evidence || [],
      createdBy: { id: createdById, name: 'Current User', role: 'support_agent' },
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    disputes = [dispute, ...disputes];
    return { ...dispute };
  }

  async getDisputes(
    page: number = 1,
    pageSize: number = 10,
    filters?: { status?: DisputeStatus; assignedTo?: string }
  ): Promise<PaginatedResponse<Dispute>> {
    await this.simulateDelay();

    let filtered = [...disputes];

    if (filters?.status) {
      filtered = filtered.filter(d => d.status === filters.status);
    }

    if (filters?.assignedTo) {
      filtered = filtered.filter(d => d.assignedTo === filters.assignedTo);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = filtered.slice(startIndex, startIndex + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getDisputeById(id: string): Promise<Dispute | null> {
    await this.simulateDelay();

    const dispute = disputes.find(d => d.id === id);
    return dispute ? { ...dispute } : null;
  }

  async updateDispute(
    id: string, 
    updates: Partial<Dispute>, 
    expectedVersion: number
  ): Promise<{ dispute: Dispute; conflict: boolean }> {
    await this.simulateDelay();

    if (this.simulateFailure()) {
      throw new Error('Network error: Failed to update dispute');
    }

    const index = disputes.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Dispute not found');
    }

    const current = disputes[index];

    // Check for version conflict
    if (current.version !== expectedVersion) {
      return {
        dispute: { ...current },
        conflict: true,
      };
    }

    const updated: Dispute = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
      version: current.version + 1,
    };

    disputes[index] = updated;
    return { dispute: { ...updated }, conflict: false };
  }

  async changeStatus(
    id: string,
    newStatus: DisputeStatus,
    actorId: string,
    notes?: string,
    approvedAmount?: number,
    expectedVersion?: number
  ): Promise<{ dispute: Dispute; conflict: boolean }> {
    await this.simulateDelay();

    if (this.simulateFailure()) {
      throw new Error('Network error: Failed to update status');
    }

    const index = disputes.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Dispute not found');
    }

    const current = disputes[index];

    // Version conflict check
    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      return { dispute: { ...current }, conflict: true };
    }

    const updates: Partial<Dispute> = {
      status: newStatus,
      updatedAt: Date.now(),
      version: current.version + 1,
    };

  //  RECONCILIATION LOGIC

    // if (newStatus === 'approved') {
    //   await transactionService.updateTransactionStatus(
    //     current.transactionId,
    //     'refunded'
    //   );
    // }

    // if (newStatus === 'rejected') {
    //   await transactionService.updateTransactionStatus(
    //     current.transactionId,
    //     'completed'
    //   );
    // }

    // if (newStatus === 'settled') {
    //   // already refunded – final confirmation step
    //   await transactionService.updateTransactionStatus(
    //     current.transactionId,
    //     'refunded'
    //   );
    // }

    if (newStatus === 'approved' || newStatus === 'rejected' || newStatus === 'settled') {
      updates.resolvedBy = actorId;
      updates.resolvedAt = Date.now();
      updates.resolutionNotes = notes;
    }

    if (approvedAmount !== undefined) {
      updates.approvedAmount = approvedAmount;
    }

    const updated = { ...current, ...updates };
    disputes[index] = updated;
    await auditService.logAction(
      id,
      'status_changed',
      {
        id: actorId,
        name: 'System User',
        role: 'finance_ops',
      },
      {
        fromStatus: current.status,
        toStatus: newStatus,
        transactionId: current.transactionId,
        // approvedAmount: approvedAmount ?? null,
      },
      current.status,
      newStatus
    );


    // reconciliation block
    const newTxnStatus = mapDisputeToTransactionStatus(newStatus);

    if (newTxnStatus) {
      await transactionService.updateTransactionStatus(
        current.transactionId,
        newTxnStatus
      );
    }
    
    return { dispute: { ...updated }, conflict: false };
  }

  async assignDispute(id: string, assigneeId: string): Promise<Dispute> {
    await this.simulateDelay();

    const index = disputes.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Dispute not found');
    }

    disputes[index] = {
      ...disputes[index],
      assignedTo: { id: assigneeId, name: 'Assigned User', role: 'risk_analyst' },
      updatedAt: Date.now(),
      version: disputes[index].version + 1,
    };

    return { ...disputes[index] };
  }

  async deleteDispute(id: string): Promise<void> {
    await this.simulateDelay();

    const index = disputes.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Dispute not found');
    }

    disputes.splice(index, 1);
  }

  async saveDraft(data: Partial<DisputeFormData>, step: number, existingDraftId?: string): Promise<DisputeDraft> {
    await this.simulateDelay();

    if (existingDraftId) {
      const index = drafts.findIndex(d => d.id === existingDraftId);
      if (index !== -1) {
        drafts[index] = {
          ...drafts[index],
          data: { ...drafts[index].data, ...data },
          step,
          savedAt: Date.now(),
        };
        return { ...drafts[index] };
      }
    }

    const draft: DisputeDraft = {
      id: `DRAFT-${String(draftIdCounter++).padStart(4, '0')}`,
      transactionId: data.transactionId,
      step,
      data,
      savedAt: Date.now(),
    };

    drafts = [draft, ...drafts];
    return { ...draft };
  }

  async getDrafts(): Promise<DisputeDraft[]> {
    await this.simulateDelay();
    return drafts.map(d => ({ ...d }));
  }

  async getDraftById(id: string): Promise<DisputeDraft | null> {
    await this.simulateDelay();
    const draft = drafts.find(d => d.id === id);
    return draft ? { ...draft } : null;
  }

  async deleteDraft(id: string): Promise<void> {
    await this.simulateDelay();
    drafts = drafts.filter(d => d.id !== id);
  }

  getDisputeCountByStatus(): Record<DisputeStatus, number> {
    return {
      draft: disputes.filter(d => d.status === 'draft').length,
      created: disputes.filter(d => d.status === 'created').length,
      under_review: disputes.filter(d => d.status === 'under_review').length,
      approved: disputes.filter(d => d.status === 'approved').length,
      rejected: disputes.filter(d => d.status === 'rejected').length,
      settled: disputes.filter(d => d.status === 'settled').length,
    };
  }
}

export const disputeService = new DisputeService();

