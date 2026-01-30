import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import type { DisputeStatus } from '../types';

interface DisputeStatusBadgeProps {
  status: DisputeStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
} 

const STATUS_ICONS: Record<DisputeStatus, string> = {
  draft: '📝',
  created: '📋',
  under_review: '🔍',
  approved: '✅',
  rejected: '❌',
  settled: '💰',
};

export function DisputeStatusBadge({ 
  status, 
  size = 'md',
  showIcon = true 
}: DisputeStatusBadgeProps) {
  const label = STATUS_LABELS[status];
  const color = STATUS_COLORS[status];
  const icon = STATUS_ICONS[status];

  return (
    <span 
      className={`dispute-status-badge dispute-status-badge--${size}`}
      style={{ 
        backgroundColor: `${color}20`,
        color: color,
        borderColor: color,
      }}
    >
      {showIcon && <span className="dispute-status-icon">{icon}</span>}
      {label}
    </span>
  );
}

export default DisputeStatusBadge;

