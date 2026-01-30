import type { UserRole, DisputeStatus, DisputeReason, Permission, User } from './types';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  support_agent: [
    'view_transactions',
    'view_masked_data',
    'create_dispute',
    'edit_dispute',
    'view_audit_log',
  ], 
  risk_analyst: [
    'view_transactions',
    'view_masked_data',
    'view_full_data',
    'create_dispute',
    'edit_dispute',
    'assign_dispute',
    'review_dispute',
    'approve_dispute',
    'reject_dispute',
    'view_audit_log',
  ],
  finance_ops: [
    'view_transactions',
    'view_full_data',
    'create_dispute',
    'edit_dispute',
    'review_dispute',
    'approve_dispute',
    'reject_dispute',
    'settle_dispute',
    'adjust_amount',
    'view_audit_log',
    'export_data',
  ],
  admin: [
    'view_transactions',
    'view_full_data',
    'create_dispute',
    'edit_dispute',
    'delete_dispute',
    'assign_dispute',
    'review_dispute',
    'approve_dispute',
    'reject_dispute',
    'settle_dispute',
    'adjust_amount',
    'view_audit_log',
    'export_data',
    'manage_users',
  ],
};

export const STATUS_TRANSITIONS: Record<DisputeStatus, { 
  nextStatuses: DisputeStatus[]; 
  allowedRoles: UserRole[];
}> = {
  draft: {
    nextStatuses: ['created'],
    allowedRoles: ['support_agent', 'risk_analyst', 'finance_ops', 'admin'],
  },
  created: {
    nextStatuses: ['under_review'],
    allowedRoles: ['risk_analyst', 'finance_ops', 'admin'],
  },
  under_review: {
    nextStatuses: ['approved', 'rejected'],
    allowedRoles: ['risk_analyst', 'finance_ops', 'admin'],
  },
  approved: {
    nextStatuses: ['settled'],
    allowedRoles: ['finance_ops', 'admin'],
  },
  rejected: {
    nextStatuses: ['under_review'],
    allowedRoles: ['admin'],
  },
  settled: {
    nextStatuses: [],
    allowedRoles: [],
  },
};

export const STATUS_LABELS: Record<DisputeStatus, string> = {
  draft: 'Draft',
  created: 'Created',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  settled: 'Settled',
};

export const STATUS_COLORS: Record<DisputeStatus, string> = {
  draft: '#6b7280',
  created: '#3b82f6',
  under_review: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  settled: '#8b5cf6',
};

export const REASON_LABELS: Record<DisputeReason, string> = {
  unauthorized_transaction: 'Unauthorized Transaction',
  duplicate_charge: 'Duplicate Charge',
  product_not_received: 'Product Not Received',
  product_not_as_described: 'Product Not As Described',
  cancelled_subscription: 'Cancelled Subscription',
  incorrect_amount: 'Incorrect Amount',
  fraudulent_activity: 'Fraudulent Activity',
  other: 'Other',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  support_agent: 'Support Agent',
  risk_analyst: 'Risk Analyst',
  finance_ops: 'Finance Ops',
  admin: 'Admin',
};

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const PRIORITY_COLORS = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

export const DEMO_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Alex Chen',
    email: 'alex.chen@fintech.com',
    role: 'support_agent',
    department: 'Customer Support',
  },
  {
    id: 'user-2',
    name: 'Sarah Miller',
    email: 'sarah.miller@fintech.com',
    role: 'risk_analyst',
    department: 'Risk Management',
  },
  {
    id: 'user-3',
    name: 'James Wilson',
    email: 'james.wilson@fintech.com',
    role: 'finance_ops',
    department: 'Finance Operations',
  },
  {
    id: 'user-4',
    name: 'Emma Thompson',
    email: 'emma.thompson@fintech.com',
    role: 'admin',
    department: 'Administration',
  },
];

export const CONFIG = {
  PAGE_SIZE: 10,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  REALTIME_POLL_INTERVAL: 3000,
  DRAFT_AUTOSAVE_INTERVAL: 30000,
  OPTIMISTIC_TIMEOUT: 5000,
  CONFLICT_CHECK_INTERVAL: 5000,
};

export const DISPUTE_WIZARD_STEPS = [
  { id: 1, title: 'Select Transaction', description: 'Choose the transaction to dispute' },
  { id: 2, title: 'Dispute Details', description: 'Provide reason and details' },
  { id: 3, title: 'Evidence & Review', description: 'Add evidence and review' },
];

export const DISPUTE_CATEGORIES = [
  { id: 'fraud', name: 'Fraud & Unauthorized' },
  { id: 'billing', name: 'Billing Issues' },
  { id: 'product', name: 'Product/Service Issues' },
  { id: 'other', name: 'Other' },
];

export const DISPUTE_REASON_CODES = [
  { code: 'FR01', name: 'Unauthorized Transaction', categoryId: 'fraud' },
  { code: 'FR02', name: 'Fraudulent Activity', categoryId: 'fraud' },
  { code: 'FR03', name: 'Identity Theft', categoryId: 'fraud' },
  { code: 'BI01', name: 'Duplicate Charge', categoryId: 'billing' },
  { code: 'BI02', name: 'Incorrect Amount', categoryId: 'billing' },
  { code: 'BI03', name: 'Cancelled Subscription', categoryId: 'billing' },
  { code: 'PR01', name: 'Product Not Received', categoryId: 'product' },
  { code: 'PR02', name: 'Product Not As Described', categoryId: 'product' },
  { code: 'PR03', name: 'Service Not Provided', categoryId: 'product' },
  { code: 'OT01', name: 'Other', categoryId: 'other' },
];

