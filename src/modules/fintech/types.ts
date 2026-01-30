export type UserRole = 'support_agent' | 'risk_analyst' | 'finance_ops' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'refunded' | 'disputed';
export type TransactionType = 'payment' | 'refund' | 'transfer' | 'withdrawal' | 'deposit';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  merchantName: string;
  cardLast4: string;
  accountNumber: string;
  timestamp: number;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionSearchParams {
  transactionId?: string;
  userId?: string;
  userName?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: TransactionStatus;
  type?: TransactionType;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type DisputeStatus = 'draft' | 'created' | 'under_review' | 'approved' | 'rejected' | 'settled';
export type DisputeReason = 
  | 'unauthorized_transaction'
  | 'duplicate_charge'
  | 'product_not_received'
  | 'product_not_as_described'
  | 'cancelled_subscription'
  | 'incorrect_amount'
  | 'fraudulent_activity'
  | 'other';

export type DisputePriority = 'low' | 'medium' | 'high' | 'critical';

export interface DisputeEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'email' | 'other';
  fileName: string;
  uploadedAt: number;
  uploadedBy: string;
}

export interface Dispute {
  id: string;
  transactionId: string;
  transaction: Transaction;
  status: DisputeStatus;
  reason: DisputeReason;
  reasonCode: string;
  category: string;
  priority: DisputePriority;
  description: string;
  originalAmount: number;
  requestedAmount: number;
  claimedAmount: number;
  approvedAmount?: number;
  currency: string;
  evidence: DisputeEvidence[];
  createdBy: { id: string; name: string; role: string };
  createdAt: number;
  updatedAt: number;
  assignedTo?: { id: string; name: string; role: string };
  resolvedBy?: string;
  resolvedAt?: number;
  resolutionNotes?: string;
  version: number; // For conflict detection
}

export interface DisputeDraft {
  id: string;
  transactionId?: string;
  step: number;
  data: Partial<DisputeFormData>;
  savedAt: number;
}

export interface DisputeFormData {
  transactionId: string;
  category?: string;
  reasonCode: string;
  reason: DisputeReason;
  priority: DisputePriority;
  description: string;
  requestedAmount: number;
  evidence: DisputeEvidence[];
}

export type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

export type AuditAction = 
  | 'dispute_created'
  | 'dispute_updated'
  | 'dispute_submitted'
  | 'dispute_assigned'
  | 'status_changed'
  | 'evidence_added'
  | 'evidence_removed'
  | 'comment_added'
  | 'dispute_approved'
  | 'dispute_rejected'
  | 'dispute_settled'
  | 'amount_adjusted'
  | 'draft_saved'
  | 'draft_resumed';

export interface AuditLogEntry {
  id: string;
  disputeId: string;
  action: AuditAction;
  actor: {
    id: string;
    name: string;
    role: UserRole;
  };
  timestamp: number;
  details: Record<string, unknown>;
  previousValue?: unknown;
  newValue?: unknown;
}

export type RealtimeEventType = 
  | 'dispute_status_changed'
  | 'dispute_assigned'
  | 'dispute_updated'
  | 'conflict_detected';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  disputeId: string;
  payload: Record<string, unknown>;
  timestamp: number;
  actorId: string;
}

export interface ConflictInfo {
  disputeId: string;
  localVersion: number;
  serverVersion: number;
  serverData: Partial<Dispute>;
  conflictedFields: string[];
}

export type Permission = 
  | 'view_transactions'
  | 'view_masked_data'
  | 'view_full_data'
  | 'create_dispute'
  | 'edit_dispute'
  | 'delete_dispute'
  | 'assign_dispute'
  | 'review_dispute'
  | 'approve_dispute'
  | 'reject_dispute'
  | 'settle_dispute'
  | 'adjust_amount'
  | 'view_audit_log'
  | 'export_data'
  | 'manage_users';

export interface OptimisticUpdate<T> {
  id: string;
  originalData: T;
  optimisticData: T;
  status: 'pending' | 'success' | 'failed';
  error?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}
