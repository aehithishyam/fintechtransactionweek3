# FinTech Transaction Dispute & Reconciliation Portal

A comprehensive enterprise-grade module for managing transaction disputes with role-based access control, real-time updates, optimistic UI patterns, and full audit trail compliance.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Module Structure](#module-structure)
- [Role-Based Access Control](#role-based-access-control)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Components](#components)
- [Hooks](#hooks)
- [Services](#services)
- [Usage](#usage)
- [Testing](#testing)

---

## Overview

The FinTech Portal provides a complete dispute management workflow, allowing financial services teams to:
- Search and review transactions with sensitive data masking
- Create disputes through a guided multi-step wizard
- Transition disputes through a defined workflow (Created → Under Review → Approved/Rejected → Settled)
- Maintain an immutable audit trail for compliance
- Handle concurrent updates with conflict resolution

---

## Features

### 🔍 Transaction Management
- Server-side search with multiple criteria (ID, customer, date range, status, type)
- Paginated results with configurable page size
- **Data Masking**: Sensitive fields (card numbers, amounts, names) masked based on permissions

### ⚖️ Dispute Workflow
- **Multi-step Wizard**: 3-step guided dispute creation (Category → Details → Review)
- **Draft Save/Resume**: Auto-save drafts every 10 seconds, resume later
- **Status Transitions**: Role-based workflow with validation

### 👥 Role-Based Access Control (RBAC)
- 4 roles: Support Agent, Risk Analyst, Finance Ops, Admin
- Granular permissions matrix
- Demo role switcher for testing

### ⚡ Real-Time Behavior
- Simulated WebSocket updates via polling
- Optimistic UI updates with automatic rollback on failure
- **Conflict Detection**: Detects when another user modifies the same dispute

### 📜 Audit & Compliance
- Immutable audit log (Object.freeze)
- Full activity trail with user, action, timestamp, and details
- Export capability for compliance reports

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FinTechPage                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        AuthProvider                              │   │
│  │  (Role, Permissions, User Context)                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Transactions │  │   Disputes   │  │  Audit Log   │                 │
│  │     Tab      │  │     Tab      │  │     Tab      │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                 │                 │                          │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐                 │
│  │ Transaction  │  │   Dispute    │  │  AuditLog    │                 │
│  │   Search     │  │    List      │  │    Panel     │                 │
│  │   + Table    │  │   + Detail   │  │              │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        Custom Hooks                              │   │
│  │  useTransactions │ useDisputes │ useDisputeWorkflow │ useAudit  │   │
│  │  useOptimisticUpdate │ useRealtimeUpdates │ useDraftDispute     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         Services                                 │   │
│  │  transactionService │ disputeService │ auditService │ realtime  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Module Structure

```
modules/fintech/
├── index.ts                    # Public exports
├── FinTechPage.tsx            # Main page orchestrator
├── types.ts                   # TypeScript interfaces
├── constants.ts               # Roles, permissions, status configs
│
├── context/
│   ├── AuthContext.tsx        # Role & permission provider
│   └── index.ts
│
├── services/
│   ├── transactionService.ts  # Mock transaction API
│   ├── disputeService.ts      # Dispute CRUD + versioning
│   ├── auditService.ts        # Immutable audit logging
│   ├── realtimeService.ts     # Polling-based real-time sim
│   └── index.ts
│
├── hooks/
│   ├── useTransactions.ts     # Search, pagination, retry
│   ├── useDisputes.ts         # Dispute CRUD operations
│   ├── useDisputeWorkflow.ts  # Status transitions + conflict
│   ├── useDraftDispute.ts     # Draft save/resume
│   ├── useOptimisticUpdate.ts # Generic optimistic updates
│   ├── useRealtimeUpdates.ts  # Real-time subscriptions
│   ├── useAuditLog.ts         # Audit queries & export
│   └── index.ts
│
├── components/
│   ├── ErrorBoundary.tsx      # React error boundary
│   ├── MaskedField.tsx        # Sensitive data display
│   ├── RoleSelector.tsx       # Demo role switcher
│   ├── DisputeStatusBadge.tsx # Status visualization
│   ├── TransactionSearch.tsx  # Search form
│   ├── TransactionTable.tsx   # Results table
│   ├── TransactionDetailsModal.tsx  # Customer Details form
│   ├── Pagination.tsx         # Page navigation
│   ├── DisputeWizard.tsx      # 3-step creation flow
│   ├── DisputeList.tsx        # Dispute cards list
│   ├── DisputeDetail.tsx      # Full dispute view
│   ├── ConflictModal.tsx      # Conflict resolution UI
│   ├── AuditLogPanel.tsx      # Audit trail display
│   ├── RealtimeIndicator.tsx  # Connection status
│   └── index.ts
│
├── utils/
│   ├── maskData.ts            # Data masking functions
│   ├── formatters.ts          # Date/time formatters
│   └── index.ts
│
└── styles/
    └── fintech.css            # Module-specific styles
```

---

## Role-Based Access Control

### Permission Matrix

| Permission          | Support Agent | Risk Analyst | Finance Ops | Admin |
|---------------------|:-------------:|:------------:|:-----------:|:-----:|
| view_transactions   | ✅            | ✅           | ✅          | ✅    |
| view_full_data      | ❌            | ✅           | ✅          | ✅    |
| create_dispute      | ✅            | ✅           | ❌          | ✅    |
| edit_dispute        | ✅            | ✅           | ❌          | ✅    |
| delete_dispute      | ❌            | ❌           | ❌          | ✅    |
| approve_dispute     | ❌            | ✅           | ❌          | ✅    |
| reject_dispute      | ❌            | ✅           | ❌          | ✅    |
| settle_dispute      | ❌            | ❌           | ✅          | ✅    |
| view_full_audit     | ❌            | ✅           | ✅          | ✅    |
| export_data         | ❌            | ❌           | ✅          | ✅    |
| manage_users        | ❌            | ❌           | ❌          | ✅    |

### Status Transition Rules

```
┌─────────┐     Submit      ┌─────────┐    Start Review   ┌──────────────┐
│  Draft  │ ─────────────▶  │ Created │ ───────────────▶  │ Under Review │
└─────────┘                 └─────────┘                   └──────────────┘
                                                                 │
                              ┌──────────────────────────────────┼──────────────────┐
                              │                                  │                  │
                              ▼                                  ▼                  │
                        ┌──────────┐                       ┌──────────┐            │
                        │ Approved │                       │ Rejected │            │
                        └────┬─────┘                       └────┬─────┘            │
                             │ Settle                           │ Close            │
                             ▼                                  ▼                  │
                        ┌──────────────────────────────────────────┐               │
                        │               Settled                     │               │
                        └──────────────────────────────────────────┘               │
```

| Current Status | Allowed Transitions | Required Role                    |
|----------------|---------------------|----------------------------------|
| draft          | created             | Support Agent, Risk Analyst, Admin |
| created        | under_review        | Risk Analyst, Admin              |
| under_review   | approved, rejected  | Risk Analyst, Admin              |
| approved       | settled             | Finance Ops, Admin               |
| rejected       | settled             | Finance Ops, Admin               |
| settled        | (terminal)          | —                                |

---

## Data Flow Diagrams

### Dispute Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Dispute Creation Flow                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

     User                    TransactionTable              DisputeWizard
       │                            │                            │
       │  1. Select Transaction     │                            │
       │ ────────────────────────▶ │                            │
       │                            │                            │
       │          2. Open Wizard    │                            │
       │ ◀───────────────────────────────────────────────────── │
       │                            │                            │
       │  3. Fill Step 1 (Category) │                            │
       │ ────────────────────────────────────────────────────▶  │
       │                            │                            │
       │  4. Fill Step 2 (Details)  │           5. Auto-save    │
       │ ────────────────────────────────────────────────────▶  │──▶ draftService
       │                            │                            │
       │  6. Review & Submit        │                            │
       │ ────────────────────────────────────────────────────▶  │
       │                            │                            │
       │                            │           7. Create        │
       │                            │           Dispute          │
       │                            │    ───────────────────▶    │
       │                            │                      disputeService
       │                            │           8. Log           │
       │                            │           Creation         │
       │                            │    ───────────────────▶    │
       │                            │                      auditService
       │                            │                            │
       │  9. Show in Dispute List   │                            │
       │ ◀───────────────────────────────────────────────────── │
```

### Optimistic Update with Rollback

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     Optimistic Update with Rollback                              │
└─────────────────────────────────────────────────────────────────────────────────┘

    User Action         Local State           API Call           Result
        │                    │                    │                 │
        │ 1. Change Status   │                    │                 │
        │ ──────────────────▶│                    │                 │
        │                    │                    │                 │
        │ 2. Immediate UI    │                    │                 │
        │    Update          │                    │                 │
        │◀──────────────────│                    │                 │
        │                    │ 3. Send Request   │                 │
        │                    │ ──────────────────▶│                 │
        │                    │                    │                 │
        │                    │                    │  SUCCESS?       │
        │                    │                    │◀────────────────│
        │                    │                    │                 │
    ┌───┴────────────────────┴────────────────────┴─────────────────┴───┐
    │                              IF SUCCESS                           │
    ├───────────────────────────────────────────────────────────────────┤
    │  4a. Commit optimistic state                                      │
    │  5a. Log to audit                                                 │
    │  6a. Publish real-time event                                      │
    └───────────────────────────────────────────────────────────────────┘
    
    ┌───────────────────────────────────────────────────────────────────┐
    │                              IF FAILURE                           │
    ├───────────────────────────────────────────────────────────────────┤
    │  4b. Rollback to previous state                                   │
    │  5b. Show error notification                                      │
    │  6b. Log failed attempt                                           │
    └───────────────────────────────────────────────────────────────────┘
```

### Conflict Detection & Resolution

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       Conflict Detection & Resolution                            │
└─────────────────────────────────────────────────────────────────────────────────┘

   User A (local)          Server              User B (concurrent)
        │                    │                         │
        │ 1. Fetch v1        │                         │
        │ ◀─────────────────│                         │
        │                    │  2. Fetch v1            │
        │                    │ ────────────────────▶  │
        │                    │                         │
        │                    │  3. Update to v2        │
        │                    │ ◀───────────────────── │
        │                    │                         │
        │ 4. Try Update v1→v3│                         │
        │ ─────────────────▶ │                         │
        │                    │                         │
        │ 5. VERSION MISMATCH│                         │
        │ ◀───────────────── │                         │
        │                    │                         │
   ┌────┴────────────────────┴─────────────────────────┴────┐
   │                  ConflictModal Opens                    │
   ├─────────────────────────────────────────────────────────┤
   │  Options:                                               │
   │  • Keep Local: Force update with User A's version       │
   │  • Use Server: Discard local, take User B's version     │
   │  • Merge: Combine changes (manual resolution)           │
   └─────────────────────────────────────────────────────────┘
```

---

## Components

### TransactionSearch
Search form with basic and advanced filters for finding transactions.

```tsx
<TransactionSearch 
  onSearch={handleSearch} 
  isLoading={isSearching} 
/>
```

### TransactionTable
Displays transactions with masked sensitive data based on permissions.

```tsx
<TransactionTable
  transactions={transactions}
  selectedId={selected?.id}
  onSelect={handleSelect}
  isLoading={loading}
/>
```

### DisputeWizard
Multi-step form for creating disputes with auto-save draft functionality.

```tsx
<DisputeWizard
  transaction={selectedTxn}
  existingDraft={draft}
  onSubmit={handleSubmit}
  onSaveDraft={handleDraft}
  onCancel={handleCancel}
  isSubmitting={submitting}
/>
```

### DisputeDetail
Full dispute view with status transition actions based on user permissions.

```tsx
<DisputeDetail
  dispute={selectedDispute}
  onStatusChange={handleStatusChange}
  onClose={handleClose}
  isUpdating={updating}
  hasConflict={hasConflict}
  onResolveConflict={handleResolve}
/>
```

### AuditLogPanel
Immutable audit trail display with filtering and export.

```tsx
<AuditLogPanel 
  disputeId={selectedDispute?.id} 
  maxEntries={100} 
/>
```

---

## Hooks

### useTransactions
```tsx
const {
  transactions,    // Current page of transactions
  pagination,      // { page, pageSize, total, totalPages }
  isLoading,
  error,
  search,          // (params) => void
  goToPage,        // (page) => void
  retry,           // () => void
} = useTransactions();
```

### useDisputes
```tsx
const {
  disputes,        // All disputes
  isLoading,
  createDispute,   // (data) => Promise<Dispute>
  updateDispute,   // (id, data) => Promise<Dispute>
  deleteDispute,   // (id) => Promise<void>
  getDispute,      // (id) => Dispute | undefined
  refresh,         // () => void
} = useDisputes();
```

### useDisputeWorkflow
```tsx
const {
  changeStatus,    // (dispute, newStatus) => Promise<Dispute>
  isUpdating,
  conflict,        // ConflictInfo | null
  resolveConflict, // (strategy) => void
} = useDisputeWorkflow();
```

### useOptimisticUpdate
```tsx
const {
  execute,         // (optimisticValue, asyncFn) => Promise<T>
  isUpdating,
  rollback,        // () => void
} = useOptimisticUpdate<T>(currentValue, onUpdate);
```

### useAuditLog
```tsx
const {
  entries,         // AuditLogEntry[]
  isLoading,
  queryByDispute,  // (disputeId) => void
  queryByUser,     // (userId) => void
  queryAll,        // (limit?) => void
  exportLog,       // (entries) => string
} = useAuditLog();
```

---

## Services

### transactionService
- `searchTransactions(params)` - Search with server-side pagination
- Generates 200 mock transactions on initialization

### disputeService
- `createDispute(data)` - Create with version tracking
- `updateDispute(id, data, expectedVersion)` - Update with conflict check
- `changeStatus(id, status, expectedVersion)` - Transition status
- `saveDraft(transactionId, data)` - Save wizard draft
- `getDraft(transactionId)` - Resume saved draft

### auditService
- `log(entry)` - Add immutable entry (Object.freeze)
- `getByEntity(id)` - Query by dispute
- `getByUser(userId)` - Query by user
- `export(entries)` - Generate JSON export

### realtimeService
- `subscribe(event, callback)` - Listen for updates
- `unsubscribe(event, callback)` - Remove listener
- `publish(event, data)` - Broadcast event (simulated)
- Uses polling to simulate WebSocket behavior

---

## Usage

### Basic Integration

```tsx
import { FinTechPage } from './modules/fintech';

function App() {
  return <FinTechPage />;
}
```

### Using Individual Hooks

```tsx
import { useTransactions, useAuth } from './modules/fintech';

function MyComponent() {
  const { transactions, search } = useTransactions();
  const { hasPermission, currentUser } = useAuth();

  if (!hasPermission('view_transactions')) {
    return <p>Access denied</p>;
  }

  return (
    <div>
      <p>Welcome, {currentUser.name}</p>
      {/* ... */}
    </div>
  );
}
```

### Custom Role Implementation

```tsx
import { AuthProvider, ROLE_PERMISSIONS } from './modules/fintech';

// Override with your auth system
const MyAuthProvider = ({ children }) => {
  const user = useMyAuthSystem(); // Your auth hook
  
  return (
    <AuthProvider initialUser={user}>
      {children}
    </AuthProvider>
  );
};
```

---

## Testing

### Unit Test Examples

```tsx
// Testing permission checks
describe('useAuth', () => {
  it('should allow support_agent to create disputes', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProviderWithRole('support_agent')
    });
    
    expect(result.current.hasPermission('create_dispute')).toBe(true);
    expect(result.current.hasPermission('approve_dispute')).toBe(false);
  });
});

// Testing status transitions
describe('useDisputeWorkflow', () => {
  it('should transition from created to under_review', async () => {
    const { result } = renderHook(() => useDisputeWorkflow());
    
    const dispute = mockDispute({ status: 'created' });
    await act(() => result.current.changeStatus(dispute, 'under_review'));
    
    expect(dispute.status).toBe('under_review');
  });
});

// Testing data masking
describe('MaskedField', () => {
  it('should mask card numbers for support_agent', () => {
    const { getByText } = render(
      <AuthProviderWithRole role="support_agent">
        <MaskedField value="1234" type="card" />
      </AuthProviderWithRole>
    );
    
    expect(getByText('•••• •••• •••• ****')).toBeInTheDocument();
  });
});
```

---

## Best Practices

1. **Always check permissions** before rendering actions
2. **Use optimistic updates** for better UX, with proper rollback
3. **Handle conflicts gracefully** - don't lose user work
4. **Log all significant actions** to the audit trail
5. **Mask sensitive data** based on user role

---

## Future Enhancements

- [ ] WebSocket integration for real-time updates
- [ ] Document attachment support
- [ ] Email notifications for status changes
- [ ] Advanced reporting and analytics
- [ ] Bulk operations support
- [ ] API integration with real backends

## End-to-End Reconciliation Flow
- Case 1: Approved dispute

Transaction: completed
        |
Create Dispute
        |
Transaction → disputed
        |
Approve
        |
Transaction → refunded   ✅ (reconciliation)
        |
Settle
        |
Final confirmation

- Case 2: Rejected dispute

Transaction: completed
        |
Create dispute
        |
Transaction → disputed
        |
Reject
        |
Transaction → completed   ✅ (reconciliation)

## Why settlement exists if already refunded?
| Step     | Purpose                         |
| -------- | ------------------------------- |
| Approved | Decision: customer wins         |
| Refunded | Money returned                  |
| Settled  | Accounting + audit finalization |

So:
Approved = logical decision
Refunded = financial action
Settled = reconciliation + bookkeeping closure


## 4.Explanation of Role-Based Access and Audit Logic

Role-Based Access Control (RBAC)
1.How roles are implemented
•	Roles are provided via the Auth context
•	Every user has:
o	id
o	name
o	role
o	permissions derived from role

const { currentUser, hasPermission } = useAuth();

2.Permission checks (centralized)
Instead of checking roles everywhere, the app uses permission-based checks, which is best practice.
Ex:
hasPermission('create_dispute')
hasPermission('view_audit_log')

3. Role-based UI behavior
	1.Creating disputes
		const canSubmit = hasPermission('create_dispute');
<button
  disabled={isSubmitting || !canSubmit}
>
  Submit Dispute
</button>

	Only authorized roles (e.g. Agent, Analyst) can create disputes

2. Dispute status transitions
Different roles can perform different actions:
Action 		        	Permission Required
Submit for review 	Submit_dispute
Approve	          	approve_dispute
Reject			        reject_dispute
Settle			        settle_dispute

Ex:  if (!hasPermission('approve_dispute')) return;
	This prevents unauthorized approvals both in UI and logic.

3.	 Audit log visibility
const canViewAudit = hasPermission('view_audit_log');

	{canViewAudit && <AuditLogPanel />}

	Only supervisory / admin roles see audit data
	 Prevents sensitive access leakage

4.	Transaction-based access
                  Disputes can only be created for completed transactions.
		if (txn.status !== 'completed') return;
This ensures:
•	No disputes for pending/failed transactions
•	Business rule enforcement at UI level

## Audit Logging Logic
Why audit logs are required
Audit logs provide:
•	Accountability (who did what)
•	Traceability (when and why)
•	Compliance (financial dispute requirements)
All critical actions are immutably recorded.

## What actions are audited in this project 

Action	             Logged when
draft_saved       	Dispute draft auto-saved
draft_resumed	      Draft reopened
create	            Dispute created
status_change	      Review / approval / rejection
update	            Dispute updates
conflict_resolved	  Concurrent update resolution

## Where audit logs are written
Audit events are recorded using auditService.
await auditService.logAction(
  entityId,
  action,
  {
    id: currentUser.id,
    name: currentUser.name,
    role: currentUser.role,
  },
  metadata
);

Each log includes:
•	User ID
•	User name
•	User role
•	Action performed
•	Contextual metadata (transaction ID, step, status)

Example: Draft save audit
auditService.logAction(
  draft.id,
  'draft_saved',
  user,
  { transactionId }
);

✔  Tracks partial work
✔  Supports resume functionality
✔  Ensures traceability

Example: Draft resume audit
auditService.logAction(
  draftId,
  'draft_resumed',
  user,
  { step }
);

✔ Shows who resumed a dispute
✔ Prevents silent modifications
