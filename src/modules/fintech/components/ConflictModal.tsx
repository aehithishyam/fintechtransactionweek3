import type { Dispute, ConflictInfo, DisputeStatus, DisputePriority } from '../types';
import { DisputeStatusBadge } from './DisputeStatusBadge';

interface ConflictModalProps {
  conflict: ConflictInfo;
  localDispute: Dispute;
  onKeepLocal: () => void;
  onUseServer: () => void;
  onCancel: () => void;
}

export function ConflictModal({
  conflict,
  localDispute,
  onKeepLocal,
  onUseServer,
  onCancel,
}: ConflictModalProps) {
  const serverDispute = conflict.serverData;

  return (
    <div className="modal-overlay">
      <div className="conflict-modal">
        <div className="conflict-modal-header">
          <span className="conflict-icon">⚠️</span>
          <h3>Conflict Detected</h3>
        </div>
        
        <div className="conflict-modal-body">
          <p className="conflict-description">
            This dispute has been modified by another user.
            Your version (v{conflict.localVersion}) conflicts with the server version (v{conflict.serverVersion}).
          </p>
          
          <div className="conflict-fields">
            <strong>Conflicted fields:</strong> {conflict.conflictedFields.join(', ')}
          </div>

          <div className="conflict-comparison">
            <div className="conflict-version local">
              <h4>Your Version (v{conflict.localVersion})</h4>
              <div className="version-details">
                <div className="detail-row">
                  <span>Status:</span>
                  <DisputeStatusBadge status={localDispute.status} size="sm" />
                </div>
                <div className="detail-row">
                  <span>Priority:</span>
                  <span className={`priority-badge priority-${localDispute.priority}`}>
                    {localDispute.priority}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Description:</span>
                  <span className="truncate">{localDispute.description}</span>
                </div>
              </div>
            </div>

            <div className="conflict-divider">
              <span>VS</span>
            </div>

            <div className="conflict-version server">
              <h4>Server Version (v{conflict.serverVersion})</h4>
              <div className="version-details">
                {serverDispute.status && (
                  <div className="detail-row">
                    <span>Status:</span>
                    <DisputeStatusBadge status={serverDispute.status as DisputeStatus} size="sm" />
                  </div>
                )}
                {serverDispute.priority && (
                  <div className="detail-row">
                    <span>Priority:</span>
                    <span className={`priority-badge priority-${serverDispute.priority}`}>
                      {serverDispute.priority as DisputePriority}
                    </span>
                  </div>
                )}
                {serverDispute.description && (
                  <div className="detail-row">
                    <span>Description:</span>
                    <span className="truncate">{serverDispute.description}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="conflict-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-warning" onClick={onKeepLocal}>
            Keep Your Version
          </button>
          <button className="btn btn-primary" onClick={onUseServer}>
            Use Server Version
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConflictModal;
