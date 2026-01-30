import type { Dispute, DisputeStatus } from '../types';
import { DisputeStatusBadge } from './DisputeStatusBadge';
import { MaskedField } from './MaskedField';
import { formatRelativeTime } from '../utils';
import { STATUS_LABELS } from '../constants';

interface DisputeListProps {
  disputes: Dispute[];
  selectedId: string | null;
  statusFilter: DisputeStatus | 'all';
  onStatusFilterChange: (status: DisputeStatus | 'all') => void;
  onSelect: (dispute: Dispute) => void;
  isLoading: boolean;
}

const STATUS_OPTIONS: (DisputeStatus | 'all')[] = [
  'all',
  'draft',
  'created',
  'under_review',
  'approved',
  'rejected',
  'settled',
];

export function DisputeList({
  disputes,
  selectedId,
  statusFilter,
  onStatusFilterChange,
  onSelect,
  isLoading,
}: DisputeListProps) {
  const filteredDisputes = statusFilter === 'all' 
    ? disputes 
    : disputes.filter(d => d.status === statusFilter);

  return (
    <div className="dispute-list">
      <div className="dispute-list-header">
        <h3>Disputes ({filteredDisputes.length})</h3>
        <div className="dispute-filters">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as DisputeStatus | 'all')}
            className="status-filter"
          >
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Statuses' : STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dispute-list-content">
        {isLoading ? (
          <div className="dispute-list-loading">
            <div className="loading-spinner"></div>
            <p>Loading disputes...</p>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="dispute-list-empty">
            <span className="empty-icon">📋</span>
            <p>No disputes found</p>
          </div>
        ) : (
          <div className="dispute-cards">
            {filteredDisputes.map(dispute => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                isSelected={selectedId === dispute.id}
                onSelect={() => onSelect(dispute)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DisputeCardProps {
  dispute: Dispute;
  isSelected: boolean;
  onSelect: () => void;
}

function DisputeCard({ dispute, isSelected, onSelect }: DisputeCardProps) {
  return (
    <div 
      className={`dispute-card ${isSelected ? 'selected' : ''} priority-${dispute.priority}`}
      onClick={onSelect}
    >
      <div className="dispute-card-header">
        <span className="dispute-id">{dispute.id}</span>
        <DisputeStatusBadge status={dispute.status} size="sm" />
      </div>
      
      <div className="dispute-card-body">
        <div className="dispute-amount">
          <MaskedField value={dispute.requestedAmount} type="amount" currency={dispute.currency} />
        </div>
        <div className="dispute-transaction">
          Transaction: {dispute.transactionId}
        </div>
        <div className="dispute-reason">
          {dispute.reason}
        </div>
      </div>
      
      <div className="dispute-card-footer">
        <span className={`priority-indicator priority-${dispute.priority}`}>
          {dispute.priority}
        </span>
        <span className="dispute-time">{formatRelativeTime(dispute.updatedAt)}</span>
      </div>
    </div>
  );
}

export default DisputeList;
