import type { Dispute, DisputeStatus } from '../types';
import { useAuth } from '../context';
import { DisputeStatusBadge } from './DisputeStatusBadge';
import { MaskedField } from './MaskedField';
import { formatDateTime, formatRelativeTime } from '../utils';
import { STATUS_TRANSITIONS, DISPUTE_CATEGORIES, DISPUTE_REASON_CODES } from '../constants';

interface DisputeDetailProps {
  dispute: Dispute;
  onStatusChange: (disputeId: string, newStatus: DisputeStatus) => void;
  onClose: () => void;
  isUpdating: boolean;
  hasConflict: boolean;
  onResolveConflict: () => void;
  refreshDisputes: () => void;
  setStatusFilter: (status: DisputeStatus | null) => void;
}

export function DisputeDetail({
  dispute,
  onStatusChange,
  onClose,
  isUpdating,
  hasConflict,
  onResolveConflict,
  refreshDisputes,
  setStatusFilter,
}: DisputeDetailProps) {
  const { canTransitionStatus } = useAuth();

  const transitionConfig = STATUS_TRANSITIONS[dispute.status];
  const allowedTransitions: DisputeStatus[] = transitionConfig?.nextStatuses || [];
  const availableActions = allowedTransitions.filter((status: DisputeStatus) =>
    canTransitionStatus(dispute.status, status)
  );

  const category = DISPUTE_CATEGORIES.find(c => c.id === dispute.category);
  const reasonCode = DISPUTE_REASON_CODES.find(r => r.code === dispute.reasonCode);

  return (
    <div className="dispute-detail">
      {hasConflict && (
        <div className="conflict-banner">
          <span className="conflict-icon">⚠️</span>
          <span>This dispute was modified by another user.</span>
          <button className="btn btn-warning" onClick={onResolveConflict}>
            Resolve Conflict
          </button>
        </div>
      )}

      <div className="dispute-detail-header">
        <div className="header-left">
          <h3>{dispute.id}</h3>
          <DisputeStatusBadge status={dispute.status} size="lg" />
          <span className={`priority-badge priority-${dispute.priority}`}>
            {dispute.priority}
          </span>
        </div>
        <button className="btn btn-icon" onClick={onClose}>✕</button>
      </div>

      <div className="dispute-detail-content">
        <section className="detail-section">
          <h4>Transaction</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Transaction ID</label>
              <span>{dispute.transactionId}</span>
            </div>
            <div className="detail-item">
              <label>Original Amount</label>
              <MaskedField value={dispute.originalAmount} type="amount" currency={dispute.currency} />
            </div>
            <div className="detail-item">
              <label>Claimed Amount</label>
              <MaskedField value={dispute.claimedAmount} type="amount" currency={dispute.currency} />
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h4>Dispute Information</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Category</label>
              <span>{category?.name || dispute.category}</span>
            </div>
            <div className="detail-item">
              <label>Reason Code</label>
              <span>{reasonCode?.code}: {reasonCode?.name || dispute.reasonCode}</span>
            </div>
          </div>
          <div className="detail-item full-width">
            <label>Description</label>
            <p className="description-text">{dispute.description}</p>
          </div>
          {dispute.evidence && dispute.evidence.length > 0 && (
            <div className="detail-item full-width">
              <label>Evidence</label>
              <p className="evidence-text">{dispute.evidence.length} file(s) attached</p>
            </div>
          )}
        </section>

        <section className="detail-section">
          <h4>Assignment</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Created By</label>
              <span>{dispute.createdBy.name} ({dispute.createdBy.role})</span>
            </div>
            {dispute.assignedTo && (
              <div className="detail-item">
                <label>Assigned To</label>
                <span>{dispute.assignedTo.name} ({dispute.assignedTo.role})</span>
              </div>
            )}
          </div>
        </section>

        <section className="detail-section">
          <h4>Timeline</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Created</label>
              <span>{formatDateTime(dispute.createdAt)}</span>
            </div>
            <div className="detail-item">
              <label>Last Updated</label>
              <span>{formatRelativeTime(dispute.updatedAt)}</span>
            </div>
            {dispute.resolvedAt && (
              <div className="detail-item">
                <label>Resolved</label>
                <span>{formatDateTime(dispute.resolvedAt)}</span>
              </div>
            )}
          </div>
          <div className="detail-item">
            <label>Version</label>
            <span>v{dispute.version}</span>
          </div>
        </section>

        {dispute.resolutionNotes && (
          <section className="detail-section">
            <h4>Resolution</h4>
            <div className="detail-item full-width">
              <label>Notes</label>
              <p className="resolution-text">{dispute.resolutionNotes}</p>
            </div>
          </section>
        )}
      </div>

      <div className="dispute-detail-actions">
        {availableActions.length > 0 ? (
          <div className="action-buttons">
            <span className="action-label">Change Status:</span>
            {availableActions.map(status => (
              <button
                key={status}
                className={`btn btn-action btn-${status.replace('_', '-')}`}
                onClick={async () => {
                  await onStatusChange(dispute.id, status);
                    setStatusFilter(null);
                    refreshDisputes();
                }}

                disabled={isUpdating || hasConflict}
              >
                {isUpdating ? '...' : getActionLabel(dispute.status, status)}
              </button>
            ))}
          </div>
        ) : (
          <div className="no-actions">
            <span className="muted">
              {dispute.status === 'settled' 
                ? 'This dispute has been settled'
                : 'No actions available for your role'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function getActionLabel(from: DisputeStatus, to: DisputeStatus): string {
  const labels: Record<string, string> = {
    'draft_created': 'Submit',
    'created_under_review': 'Start Review',
    'under_review_approved': 'Approve',
    'under_review_rejected': 'Reject',
    'approved_settled': 'Settle',
    'rejected_settled': 'Close',
  };
  return labels[`${from}_${to}`] || `Move to ${to}`;
}

export default DisputeDetail;
