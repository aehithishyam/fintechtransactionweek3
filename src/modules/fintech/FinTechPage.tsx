import { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './context';
import {
  useTransactions,
  useDisputes,
  useDisputeWorkflow,
  useRealtimeUpdates,
} from './hooks';
import {
  ErrorBoundary,
  RoleSelector,
  TransactionSearch,
  TransactionTable,
  Pagination,
  DisputeWizard,
  DisputeList,
  DisputeDetail,
  ConflictModal,
  AuditLogPanel,
  RealtimeIndicator,
} from './components';
import { useDraftDispute } from './hooks';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import type { Transaction, Dispute, DisputeStatus, DisputeFormData, TransactionSearchParams } from './types';
import './styles/fintech.css';

type ViewMode = 'transactions' | 'disputes' | 'audit';

function FinTechPortalContent() {
  const { currentUser, hasPermission } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('transactions');
  
  // Transaction state
  const {
    transactions,
    pagination,
    loading: txnLoadingState,
    setSearchParams,
    goToPage,
    refresh: retryTransactions,
  } = useTransactions();
  
  const txnLoading = txnLoadingState.isLoading;
  const txnError = txnLoadingState.error;

  // Dispute state
// Dispute state (SINGLE SOURCE OF TRUTH)
  const {
    disputes,
    loading: disputeLoadingState,
    refresh: refreshDisputes,
    setStatusFilter: setDisputeStatusFilter,
    getDisputeById,
    createDispute,
  } = useDisputes();

  const disputeLoading = disputeLoadingState.isLoading;

  const {
    isProcessing: isUpdating,
    submitForReview,
    approve,
    reject,
    settle,
  } = useDisputeWorkflow();

  // UI state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'all'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTransactionDetails, setSelectedTransactionDetails] = useState<Transaction | null>(null);
  const {
    getDraftByTransactionId,
    currentDraft,
    saveDraft,
    status: draftStatus,
    clearCurrentDraft,
  } = useDraftDispute();
  // Real-time updates
  const {
    isConnected,
    conflicts,
    subscribeToDispute,
    resolveConflict,
  } = useRealtimeUpdates();
  
  const conflict = conflicts.length > 0 ? conflicts[0] : null;

  // Subscribe to real-time updates
  useEffect(() => {
    if (selectedDispute) {
      const disputeId = selectedDispute.id;
      const unsubscribe = subscribeToDispute(disputeId, async (event) => {
        if (event.type === 'dispute_updated' && disputeId === event.disputeId) {
          const updatedDispute = await getDisputeById(event.disputeId);
          if (updatedDispute) {
            setSelectedDispute(updatedDispute);
          }
        }
        refreshDisputes();
      });
      return () => unsubscribe();
    }
    return undefined;
  }, [selectedDispute, getDisputeById, refreshDisputes, subscribeToDispute]);

  const handleTransactionSearch = useCallback((params: TransactionSearchParams) => {
    setSearchParams(params);
    }, [setSearchParams]);

  const handleTransactionSelect = useCallback(
    (txn: Transaction) => {
      if (txn.status !== 'completed') return;

      const draft = getDraftByTransactionId(txn.id);

      if (!draft) {
        clearCurrentDraft();
      }

      setSelectedTransaction(txn);
      setShowWizard(true);
    },
    [getDraftByTransactionId, clearCurrentDraft]
  );

  const handleDisputeSelect = useCallback((dispute: Dispute) => {
    setSelectedDispute(dispute);
    setViewMode('disputes');
  }, []);

  const handleDisputeSubmit = useCallback(
    async (data: DisputeFormData) => {
      setIsSubmitting(true);
      try {
        const newDispute = await createDispute(data);

        clearCurrentDraft();

        setShowWizard(false);
        setSelectedTransaction(null);
        setSelectedDispute(newDispute);
        setViewMode('disputes');
      } finally {
        setIsSubmitting(false);
      }
    },
    [createDispute, clearCurrentDraft]
  );


  const handleStatusChange = useCallback(async (disputeId: string, newStatus: DisputeStatus) => {
    const dispute = await getDisputeById(disputeId);
    if (!dispute) return;

    try {
      let result;
      switch (newStatus) {
        case 'under_review':
          result = await submitForReview(dispute);
          break;
        case 'approved':
          result = await approve(dispute);
          break;
        case 'rejected':
          result = await reject(dispute, 'Rejected by user');
          break;
        case 'settled':
          result = await settle(dispute);
          break;
        default:
          return;
      }
      
      if (result.success && result.dispute) {
        setSelectedDispute(result.dispute);
      }
    } catch (error) {
      console.error('Failed to change status:', error);
    }
  }, [getDisputeById, submitForReview, approve, reject, settle]);

  const handleResolveConflict = useCallback(async () => {
    if (conflict) {
      resolveConflict(conflict.disputeId, 'use_server');
      const updated = await getDisputeById(conflict.disputeId);
      if (updated) {
        setSelectedDispute(updated);
      }
    }
  }, [conflict, resolveConflict, getDisputeById]);

  const canViewAudit = hasPermission('view_audit_log');

  return (
    <div className="fintech-portal">
      <header className="fintech-header">
        <div className="header-left">
          <h1>Transaction Dispute & Reconciliation Portal</h1>
          <p className="header-subtitle">Manage disputes and reconcile transactions</p>
        </div>
        <div className="header-right">
          <RealtimeIndicator
            isConnected={isConnected}
          />
          <RoleSelector />
        </div>
      </header>

      <nav className="fintech-nav">
        <button
          className={`nav-tab ${viewMode === 'transactions' ? 'active' : ''}`}
          onClick={() => setViewMode('transactions')}
        >
          📋 Transactions
        </button>
        <button
          className={`nav-tab ${viewMode === 'disputes' ? 'active' : ''}`}
          onClick={() => setViewMode('disputes')}
        >
          ⚖️ Disputes
          {disputes.filter(d => d.status === 'created' || d.status === 'under_review').length > 0 && (
            <span className="nav-badge">
              {disputes.filter(d => d.status === 'created' || d.status === 'under_review').length}
            </span>
          )}
        </button>
        {canViewAudit && (
          <button
            className={`nav-tab ${viewMode === 'audit' ? 'active' : ''}`}
            onClick={() => setViewMode('audit')}
          >
            📜 Audit Log
          </button>
        )}
      </nav>

      <main className="fintech-main">
        <ErrorBoundary>
          {viewMode === 'transactions' && (
            <div className="transactions-view">
              <TransactionSearch
                onSearch={handleTransactionSearch}
                isLoading={txnLoading}
              />
              {txnError ? (
                <div className="error-panel">
                  <span className="error-icon">⚠️</span>
                  <span>{txnError}</span>
                  <button className="btn btn-primary" onClick={retryTransactions}>
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <TransactionTable
                    transactions={transactions}
                    selectedId={selectedTransaction?.id || null}
                    onSelect={handleTransactionSelect}
                    onViewDetails={setSelectedTransactionDetails}
                    isLoading={txnLoading}
                  />
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    pageSize={pagination.pageSize}
                    onPageChange={goToPage}
                  />
                </>
              )}

              {showWizard && selectedTransaction && (
                <div className="wizard-overlay">
                  <DisputeWizard
                    transaction={selectedTransaction}
                    existingDraft={currentDraft}
                    draftStatus={draftStatus}
                    onSaveDraft={(data) => {
                      if (selectedTransaction) {
                        saveDraft(selectedTransaction.id, data);
                      }
                    }}
                    onSubmit={handleDisputeSubmit}
                    onCancel={() => {
                      setShowWizard(false);
                      setSelectedTransaction(null);
                    }}
                    isSubmitting={isSubmitting}
                  />

                </div>
              )}
            </div>
          )}

          {viewMode === 'disputes' && (
            <div className="disputes-view">
              <div className="disputes-layout">
                <aside className="disputes-sidebar">
                  <DisputeList
                    disputes={disputes}
                    selectedId={selectedDispute?.id || null}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    onSelect={handleDisputeSelect}
                    isLoading={disputeLoading}
                  />
                </aside>
                <section className="disputes-content">
                  {selectedDispute ? (
                    <>
                      <DisputeDetail
                        dispute={selectedDispute}
                        onStatusChange={handleStatusChange}
                        onClose={() => setSelectedDispute(null)}
                        isUpdating={isUpdating}
                        hasConflict={conflict?.disputeId === selectedDispute.id}
                        onResolveConflict={handleResolveConflict}
                        refreshDisputes={refreshDisputes}
                        setStatusFilter={setDisputeStatusFilter}
                      />

                      {conflict && conflict.disputeId === selectedDispute.id && (
                        <ConflictModal
                          conflict={conflict}
                          localDispute={selectedDispute}
                          onKeepLocal={() => resolveConflict(conflict.disputeId, 'keep_local')}
                          onUseServer={() => resolveConflict(conflict.disputeId, 'use_server')}
                          onCancel={() => resolveConflict(conflict.disputeId, 'use_server')}
                        />
                      )}
                    </>
                  ) : (
                    <div className="no-selection">
                      <span className="empty-icon">⚖️</span>
                      <p>Select a dispute to view details</p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {viewMode === 'audit' && canViewAudit && (
            <div className="audit-view">
              <AuditLogPanel
                disputeId={selectedDispute?.id}
                maxEntries={100}
              />
            </div>
          )}
        </ErrorBoundary>
      </main>

      <footer className="fintech-footer">
        <div className="footer-left">
          <span>Logged in as: <strong>{currentUser.name}</strong> ({currentUser.role})</span>
        </div>
        <div className="footer-right">
          {/* © */}
          <span> 2026 FinTech Portal</span>
        </div>
      </footer>
      {selectedTransactionDetails && (
        <TransactionDetailsModal
          transaction={selectedTransactionDetails}
          onClose={() => setSelectedTransactionDetails(null)}
        />
      )}

    </div>
  );
}

export function FinTechPage() {
  return (
    <AuthProvider>
      <FinTechPortalContent />
    </AuthProvider>
  );
}

export default FinTechPage;
