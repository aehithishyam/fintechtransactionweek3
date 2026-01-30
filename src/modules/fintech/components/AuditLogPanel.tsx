import { useState, useCallback } from 'react';
import type { AuditLogEntry } from '../types';
import { useAuditLog } from '../hooks';
import { useAuth } from '../context';
import { formatDateTime, formatRelativeTime } from '../utils';

interface AuditLogPanelProps {
  disputeId?: string;
  maxEntries?: number;
}

export function AuditLogPanel({ disputeId, maxEntries = 50 }: AuditLogPanelProps) {
  const { entries, isLoading, loadDisputeAuditLog, loadAllLogs, exportLog } = useAuditLog(disputeId);
  const { currentUser, hasPermission } = useAuth();
  const [filter, setFilter] = useState<'all' | 'dispute' | 'mine'>('all');

  const canViewFullLog = hasPermission('view_audit_log');
  const canExport = hasPermission('export_data');
  
  const limitedEntries = entries.slice(0, maxEntries);

  const handleFilterChange = useCallback((newFilter: 'all' | 'dispute' | 'mine') => {
    setFilter(newFilter);
    switch (newFilter) {
      case 'all':
        loadAllLogs(1);
        break;
      case 'dispute':
        if (disputeId) loadDisputeAuditLog(disputeId);
        break;
      case 'mine':
        loadAllLogs(1);
        break;
    }
  }, [disputeId, loadAllLogs, loadDisputeAuditLog]);

  const handleExport = async () => {
    try {
      const data = await exportLog(disputeId);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export audit log:', error);
    }
  };

  const displayedEntries = canViewFullLog 
    ? (filter === 'mine' ? limitedEntries.filter(e => e.actor.id === currentUser.id) : limitedEntries)
    : limitedEntries.filter(e => e.actor.id === currentUser.id);

  return (
    <div className="audit-log-panel">
      <div className="audit-log-header">
        <h3>Audit Trail</h3>
        <div className="audit-log-controls">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
              disabled={!canViewFullLog}
            >
              All
            </button>
            {disputeId && (
              <button
                className={`filter-btn ${filter === 'dispute' ? 'active' : ''}`}
                onClick={() => handleFilterChange('dispute')}
              >
                This Dispute
              </button>
            )}
            <button
              className={`filter-btn ${filter === 'mine' ? 'active' : ''}`}
              onClick={() => handleFilterChange('mine')}
            >
              My Actions
            </button>
          </div>
          {canExport && (
            <button className="btn btn-sm btn-secondary" onClick={handleExport}>
              📤 Export
            </button>
          )}
        </div>
      </div>

      <div className="audit-log-content">
        {isLoading ? (
          <div className="audit-log-loading">
            <div className="loading-spinner"></div>
            <p>Loading audit trail...</p>
          </div>
        ) : displayedEntries.length === 0 ? (
          <div className="audit-log-empty">
            <span className="empty-icon">📋</span>
            <p>No audit entries found</p>
          </div>
        ) : (
          <div className="audit-entries">
            {displayedEntries.map(entry => (
              <AuditEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      <div className="audit-log-footer">
        <span className="entry-count">{displayedEntries.length} entries</span>
        <span className="immutable-notice">🔒 Immutable log - entries cannot be modified</span>
      </div>
    </div>
  );
}

interface AuditEntryProps {
  entry: AuditLogEntry;
}

function AuditEntry({ entry }: AuditEntryProps) {
  const [expanded, setExpanded] = useState(false);

  const getActionIcon = (action: string): string => {
    switch (action) {
      case 'dispute_created': return '➕';
      case 'dispute_updated': return '✏️';
      case 'status_changed': return '🔄';
      case 'evidence_added': return '📎';
      case 'dispute_approved': return '✅';
      case 'dispute_rejected': return '❌';
      case 'dispute_assigned': return '👤';
      case 'comment_added': return '💬';
      default: return '📋';
    }
  };

  return (
    <div className={`audit-entry audit-entry--${entry.action}`}>
      <div className="audit-entry-icon">
        {getActionIcon(entry.action)}
      </div>
      <div className="audit-entry-content">
        <div className="audit-entry-header">
          <span className="audit-action">{entry.action.replace(/_/g, ' ')}</span>
          <span className="audit-entity">Dispute: {entry.disputeId}</span>
          <span className="audit-time" title={formatDateTime(entry.timestamp)}>
            {formatRelativeTime(entry.timestamp)}
          </span>
        </div>
        <div className="audit-entry-user">
          by <strong>{entry.actor.name}</strong> ({entry.actor.role})
        </div>
        {entry.details && Object.keys(entry.details).length > 0 && (
          <div className="audit-entry-details">
            <button 
              className="details-toggle"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '▼ Hide Details' : '▶ Show Details'}
            </button>
            {expanded && (
              <pre className="details-content">
                {JSON.stringify(
                  {
                    from: entry.previousValue,
                    to: entry.newValue,
                    details: entry.details,
                  },
                  null,
                  2
                )}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogPanel;
